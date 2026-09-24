# AWS-only deployment

This branch (`aws`) deploys the same application entirely on AWS. The `main` branch is unchanged
and still deploys to Cloudflare + Google Cloud Run, so the two can be compared side by side.

| | `main` branch | `aws` branch |
|---|---|---|
| Static site | Cloudflare Workers | S3 (private) + CloudFront |
| API | Cloud Run (container) | Lambda (zip) + Function URL |
| Security headers | `_headers` file | CloudFront response-headers policy |
| Site ↔ API | Different domains, CORS required | **One domain**, `/api/*` routed to Lambda — no CORS |
| Deploy auth | Cloudflare/GCP repo connection | GitHub OIDC → temporary AWS credentials, **no stored keys** |
| Infrastructure | Configured in dashboards | **CloudFormation**, versioned in this repo |

## Architecture

```
                         ┌──────────────────────────────┐
   browser ──────────▶   │        CloudFront            │
                         │  (TLS, security headers,     │
                         │   URL rewrite function)      │
                         └───────┬───────────────┬──────┘
                        /*       │               │   /api/*
                                 ▼               ▼
                    ┌────────────────┐   ┌──────────────────┐
                    │  S3 (private,  │   │ Lambda           │
                    │  OAC only)     │   │ FastAPI + Mangum │
                    └────────────────┘   └──────────────────┘
```

Serving the API from the same domain is the key simplification: the browser never makes a
cross-origin request, so there is no CORS configuration anywhere and the Content-Security-Policy
stays at `connect-src 'self'`.

Two details worth knowing:

- **A CloudFront Function rewrites URLs at the edge.** S3 serves objects by exact key, so `/visas/`
  has to become `/visas/index.html`; the same function strips the `/api` prefix so FastAPI sees its
  own routes.
- **The search index is bundled into the Lambda zip** rather than fetched over HTTP at runtime.
  Search works even if the site is unreachable, and there is no network round-trip on a cold start.

## Cost

Everything here sits on an always-free AWS tier at this scale. These allowances do **not** expire:

| Service | Always-free allowance | This project uses |
|---|---|---|
| Lambda | 1,000,000 requests + 400,000 GB-seconds / month | a handful of requests |
| CloudFront | 1 TB transfer + 10,000,000 requests / month | a few MB |
| S3 | *(not always-free for new accounts)* | ~20 MB ≈ $0.0005/month |

Cost controls are built into the templates rather than left to discipline:

- `ReservedConcurrentExecutions: 5` on the Lambda — a hard ceiling on simultaneous executions, so
  a traffic spike cannot become a compute bill.
- CloudWatch log group declared with `RetentionInDays: 7`. Left implicit, Lambda creates it with
  "never expire" and storage grows forever.
- Lifecycle rule expiring Lambda zips after 7 days, so the artifacts bucket does not accumulate
  a new ~5 MB package on every push.
- `PriceClass_100` on CloudFront — the cheapest edge footprint.
- No NAT gateway, no VPC, no API Gateway. Each of those bills by the hour or has only a 12-month
  free tier; none is needed here.

> **Account plan matters.** New AWS accounts start on the *Free Plan*, which expires after 6 months
> or when the signup credits run out — and then **AWS closes the account and deletes the
> resources**. For a portfolio that needs to stay reachable during a job search, upgrade to the
> *Paid Plan*: it keeps the always-free allowances, and costs nothing as long as usage stays inside
> them. Pair it with an AWS Budget alert (below) so there are no surprises.

## One-time setup

### 1. Deploy the bootstrap stack

Creates the GitHub OIDC trust, the deploy role and the artifacts bucket. Run once, locally, with
the AWS CLI signed in as your own user:

```bash
aws cloudformation deploy \
  --template-file aws/cloudformation/bootstrap.yml \
  --stack-name embassy-bootstrap \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides GitHubRepo=AZshirz/embassy-site-rebuild GitHubRef=refs/heads/aws

aws cloudformation describe-stacks --stack-name embassy-bootstrap \
  --query "Stacks[0].Outputs" --output table
```

### 2. Set three repository variables

GitHub → repository → **Settings → Secrets and variables → Actions → Variables**:

| Name | Value |
|---|---|
| `AWS_DEPLOY_ROLE` | the `DeployRoleArn` output above |
| `AWS_ARTIFACTS_BUCKET` | the `ArtifactsBucketName` output above |
| `AWS_REGION` | e.g. `us-east-1` |

These are *variables*, not secrets — the role ARN is not a credential. Nothing secret is stored:
GitHub mints a short-lived OIDC token per run, and the role only trusts this repository's
`aws` branch.

### 3. Set a budget alarm

AWS Console → **Billing → Budgets → Create budget** → Zero-spend or a $1 monthly budget with
alerts. The first two budgets are free.

### 4. Push

Any push to the `aws` branch runs [`deploy-aws.yml`](../.github/workflows/deploy-aws.yml): builds
the site, runs the accessibility gate, packages the Lambda, deploys the stack, publishes to S3,
invalidates CloudFront, and smoke-tests the live URL. The site URL appears in the run summary.

The first deploy takes ~15 minutes because CloudFront distributions are slow to create; later
deploys take 2–3 minutes.

## Troubleshooting

### `Not authorized to perform sts:AssumeRoleWithWebIdentity`

The role exists and was found, but its trust policy rejected the token. Almost always the subject
claim does not match what the policy expects.

GitHub issues one of two subject formats, and **which one it sends is not obvious from the
documentation**:

```
repo:OWNER/REPO:ref:refs/heads/aws                       plain
repo:OWNER@330568160/REPO@1379002690:ref:refs/heads/aws   with immutable numeric IDs
```

The second form exists so that renaming an account or repository cannot be used to inherit
another project's trust relationship. This project hit exactly that: the trust policy was written
for the plain form, GitHub sent the ID form, and the two never matched even though every visible
string looked correct. The template now accepts both.

To see what your repository actually sends, the deploy workflow has a
**"Show the OIDC claims this run presents"** step that decodes the token's claims (never the token
itself). Compare its `sub` line against the role's **Trust relationships** tab in IAM.

Your numeric IDs come from the GitHub API:

```bash
curl -s https://api.github.com/repos/OWNER/REPO | grep -E '"id"'
```

## Tearing it down

```bash
aws cloudformation delete-stack --stack-name embassy-app
# empty the buckets first if the delete complains about them being non-empty
aws cloudformation delete-stack --stack-name embassy-bootstrap
```
