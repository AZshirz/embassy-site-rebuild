# AWS deployment

**Live:** https://d19v507gh8thmt.cloudfront.net · API health check at https://d19v507gh8thmt.cloudfront.net/api/health

This branch (`aws`) runs the same site and API entirely on AWS. The `main` branch deploys to
Cloudflare and Google Cloud Run, so the two can be compared side by side. Site changes are made on
`main` and merged in here.

| | `main` branch | `aws` branch |
|---|---|---|
| Static site | Cloudflare Workers | S3 (private) behind CloudFront |
| API | Cloud Run (container) | Lambda (zip) behind CloudFront |
| Security headers | `_headers` file | CloudFront response headers policy |
| Site to API | Two domains, so CORS | One domain, `/api/*` goes to Lambda, no CORS |
| Deploy credentials | Cloudflare and Google connect to the repository | GitHub OIDC, short-lived AWS credentials, no stored keys |
| Infrastructure | Set up in the dashboards | CloudFormation, in this repository |

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

Putting the API on the same domain is what keeps this simple. The browser never makes a
cross-origin request, so there's no CORS setup anywhere, and the Content-Security-Policy stays at
`connect-src 'self'`.

A few details:

- **A CloudFront Function rewrites URLs.** S3 serves objects by exact key, so `/visas/` has to become
  `/visas/index.html`. The same function strips the `/api` prefix so FastAPI sees its own routes.
- **The Lambda only answers CloudFront.** CloudFront adds a secret header (`X-Origin-Verify`, derived
  from the stack's ID) to every API request, and the API refuses anything without it. Otherwise the
  public Lambda URL could be called directly with a forged visitor address to get around the rate
  limit, which uses CloudFront's `CloudFront-Viewer-Address`.
- **Only 403 is mapped to the 404 page.** A private bucket answers a missing file with 403, so that
  becomes `/404.html`. CloudFront error pages also apply to `/api/*`, and the API's own 404s have to
  stay JSON, so there is no 404 mapping.
- **The search index is bundled into the Lambda zip** instead of fetched at runtime, so search
  doesn't need the site to be reachable and a cold start makes no extra request.
- **Swagger UI is off here** (`API_DOCS=off`). It loads from a CDN the CSP blocks. The schema is at
  `/api/openapi.json`.

## Cost

At this traffic everything fits inside AWS's always-free allowances, which don't expire:

| Service | Always-free allowance | This project uses |
|---|---|---|
| Lambda | 1,000,000 requests and 400,000 GB-seconds a month | a handful of requests |
| CloudFront | 1 TB transfer and 10,000,000 requests a month | a few MB |
| S3 | *(not always-free for new accounts)* | about 20 MB, roughly $0.0005 a month |

The limits are in the templates:

- The CloudWatch log group is declared with `RetentionInDays: 7`. Left to Lambda, it would be
  created with "never expire" and grow forever.
- A lifecycle rule deletes Lambda zips after 7 days, so the artifacts bucket doesn't keep a new
  ~5 MB package from every push.
- CloudFront uses `PriceClass_100`, the cheapest set of edge locations.
- No NAT gateway, VPC or API Gateway. Each of those bills by the hour or is only free for 12 months.
- The template can cap Lambda concurrency (`MaxConcurrency`), but it's off by default: AWS requires
  100 unreserved executions to remain in the account, and new accounts often have too small a quota
  to reserve any. Set the repository variable `AWS_MAX_CONCURRENCY` to turn it on.

> **The account plan matters.** New AWS accounts start on the *Free Plan*, which ends after 6 months
> or when the signup credits run out, and then **AWS closes the account and deletes everything in
> it**. To keep the site up longer, move to the *Paid Plan*. It keeps the always-free allowances and
> costs nothing while usage stays inside them. Set up a budget alert at the same time (below).

## One-time setup

### 1. Deploy the bootstrap stack

This creates the GitHub OIDC trust, the deploy role and the artifacts bucket. Run it once, locally,
with the AWS CLI signed in as your own user:

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

These are variables, not secrets, because a role ARN isn't a credential. GitHub issues a
short-lived OIDC token for each run, and the role only trusts this repository's `aws` branch.

### 3. Set a budget alert

AWS Console → **Billing → Budgets → Create budget**, then a zero-spend or $1 monthly budget. The
first two budgets are free.

### 4. Push

A push to `aws` runs [`deploy-aws.yml`](../.github/workflows/deploy-aws.yml). It first runs the whole
CI suite (`ci.yml`) against the exact build it's about to ship, and stops there if anything fails.
Then it packages the Lambda and checks that it imports, deploys the stack, publishes the site to
S3, clears the CloudFront cache, and smoke-tests the live site: pages, API, the 404 page, the API's
JSON 404s, and that the stylesheet isn't cached as `immutable`.

The first deploy takes about 15 minutes because CloudFront distributions are slow to create. After
that, a deploy takes about 10 minutes, most of it CI.

## Troubleshooting

### `Not authorized to perform sts:AssumeRoleWithWebIdentity`

The role was found, but its trust policy rejected the token. It's almost always the subject claim
not matching what the policy expects.

GitHub sends one of two subject formats, and the documentation doesn't make clear which:

```
repo:OWNER/REPO:ref:refs/heads/aws                       plain
repo:OWNER@330568160/REPO@1379002690:ref:refs/heads/aws   with numeric IDs
```

The second form means renaming an account or repository can't be used to inherit another
project's trust. I hit this: the trust policy was written for the plain form, GitHub sent the ID
form, and they never matched even though every visible name looked right. The template now
accepts both.

The deploy workflow has a **"Show the OIDC claims this run presents"** step that prints the
token's claims (never the token itself). Compare its `sub` line with the role's
**Trust relationships** tab in IAM. Your numeric IDs come from the GitHub API:

```bash
curl -s https://api.github.com/repos/OWNER/REPO | grep -E '"id"'
```

### `403 Forbidden` from the API while the pages work

Check the response body first. There are two different 403s:

- `{"detail":"Forbidden."}` comes from the API itself: the request didn't carry CloudFront's
  `X-Origin-Verify` header. Calling the Lambda URL (the `ApiFunctionUrl` output) directly always
  gets this, by design. If requests through CloudFront get it too, CloudFront and the Lambda
  disagree about the header. To change that header, deploy twice: first make CloudFront send the
  new value, then make the Lambda require it. In a single deploy the Lambda switches immediately
  while CloudFront takes minutes, and every API call in between is refused.
- `{"Message":"Forbidden"}` comes from AWS, before the code runs. A public function URL needs
  **two** resource-based policy statements, not one:

  | Action | Condition |
  |---|---|
  | `lambda:InvokeFunctionUrl` | `lambda:FunctionUrlAuthType` = `NONE` |
  | `lambda:InvokeFunction` | `lambda:InvokedViaFunctionUrl` = `true` |

  AWS started requiring the second one in **October 2025**. The console and AWS SAM add both, but
  **CloudFormation doesn't**, and nearly every example written before then shows only the first.
  The symptom is a 403 while the auth type says `NONE` and the policy looks right, which is what
  happened here.

## Tearing it down

```bash
aws cloudformation delete-stack --stack-name embassy-app
# empty the buckets first if the delete complains that they aren't empty
aws cloudformation delete-stack --stack-name embassy-bootstrap
```
