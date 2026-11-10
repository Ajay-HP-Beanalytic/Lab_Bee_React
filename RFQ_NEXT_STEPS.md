# Lab Bee: RFQ automation next steps

Status as of 9 November 2026, after the TS1 release to labbee.beanalytic.com (PR #49, commit `fa97986`).

The Enquiries & Quotes menu is hidden until the usability pass below is done. No passwords or keys belong in this file.

## 1. Start here

1. Confirm the server items in section 2.
2. Fix the security items marked **Before relaunch** in section 4.
3. Set the `.env` values (section 6) and import the Excel files (section 7).
4. Work through the usability pass (section 5).
5. Bring the menu back (section 8), with the email reader still off.
6. Test with a few real emails, then turn the email reader on.

## 2. Confirm on the server

These steps were given for the deployment, but only the ones marked confirmed were seen to finish.

| Item | How to check | Status |
|---|---|---|
| App is running on Node 22 | `pm2 show labbee \| grep -i "node.js version"` | App confirmed working; version to check |
| `SESSION_SECRET` is set | `grep -c '^SESSION_SECRET=' Backend/.env.production` gives 1 | Confirmed |
| New tables exist | `SHOW TABLES LIKE 'ts1_%';` lists `ts1_chamber_breakdowns`, `ts1_spare_parts`, `ts1_report_workflow` | To check |
| Email reader is off | `grep '^EMAIL_INTAKE_ENABLED' Backend/.env.production` shows `false` | To check |
| LibreOffice is installed | `which soffice` | To check |
| Uploads up to 100 MB | `sudo nginx -T \| grep client_max_body_size` | To check |
| MySQL root password changed | It appeared in deployment notes shared in a chat. Update `DB_PASSWORD` too if it's the same one. | **To do** |

## 3. Security and bugs resolved in this release

### Security

| Severity | Problem | Fix |
|---|---|---|
| Critical | Most older APIs and uploaded files worked without logging in | Login is now required for all APIs and uploads, except login, registration, password reset and the token-protected customer links (`Backend/access/requireLogin.js`) |
| Critical | Full database backup could be downloaded by anyone | Administration only |
| High | Any website could call the API with a user's session | Only the Lab Bee address, the office network and the API's own host are allowed |
| High | Session secret fell back to the word "secret" | Production uses `SESSION_SECRET`, or a random value if it's missing |
| High | Any logged-in user could delete chambers or job card rows | Needs the matching menu access |
| Medium | Uploaded web pages could run inside Lab Bee | HTML, SVG, XML and script files now download instead |
| Medium | Session cookie protections were missing | `httpOnly` and `sameSite` added; `secure` applies when the backend itself runs HTTPS |

### Bugs

- Closed job card details could be changed through the API, and the old "Close" status escaped the lock.
- Saved names disappeared from the Started By, Ended By, Reviewed By and Prepared By fields when that person wasn't logged in.
- An enquiry marked not feasible could never be corrected. There is now a **Back to feasibility check** action, and Reopen returns it to the feasibility check.
- Lost, Customer asked for a quote and Prepare quote no longer appear on a not-feasible enquiry.
- An enquiry with no tests now gets a row to say what can't be done.
- The customer enquiry form was sending visitors to the login page.
- Dashboard chart labels were being cut short.

### Tests run before the release

On the dev database: 131 report workflow, 36 login gate, 27 feasibility and 29 breakdown and spares checks, all passing. The frontend built. The pages were not opened in a browser as part of these tests.

The review read login, files, uploads, public links, saving and permissions closely. The rest was scanned by pattern, not read line by line.

## 4. Still to resolve

### Security

| Priority | Item | Detail |
|---|---|---|
| **Before relaunch** | `.env` files are tracked in Git | `Backend/.env.production`, `Backend/.env.development`, `Backend/.env copy`, `frontend/.env.*`. Stop tracking them, keep the repository private, and replace any key or password that may have been seen. Once untracked, server edits can no longer block `git pull`. |
| **Before relaunch** | Live notifications don't check who connects | Someone can claim a user's name on the socket connection and receive that user's alerts, which include enquiry details. |
| **Before relaunch** | Repeated login guesses | No limit could be confirmed on `/api/login`. Add one, and on the password reset codes if needed. |
| High | Backend dependencies | `npm audit --omit=dev` lists 48 issues (2 critical, 26 high). Direct: `axios`, `body-parser`, `mysql2`, `nodemailer`, `openai`, `react-router-dom`. Several need major upgrades, so test after each. |
| Medium | Read access | Any logged-in user can read job card and slot booking data through the API, whatever their menu access. |
| Medium | Error details | Some older routes return database error text to the browser. |
| Low | Cookie `secure` flag | Nginx handles HTTPS and the backend runs plain HTTP, so the flag isn't set. Needs `trust proxy` and a code change. |

### Bugs and gaps

| Item | Detail |
|---|---|
| Report link rate limit | Behind nginx every visitor counts as one address. Set `app.set("trust proxy", "loopback")` in `Backend/index.js`. |
| `nginx/nginx.conf` in the repo | Add `client_max_body_size 100m;` and `proxy_read_timeout 180s;`, or the next copy of this file onto the server removes them. |
| Customer portal address | `REACT_APP_API_URL` is missing from `frontend/.env.production`, so the form would call `localhost:4001`. See section 6 for `FRONTEND_URL` too. |
| Not-feasible draft quote | Only the screen stops it. `POST /api/enquiries/:id/draft-quote` should refuse as well. |
| `generate-link` | Takes `generated_by` from the request. It should use the logged-in user. |
| Backend `package.json` | Holds React packages it doesn't need. They cause the peer conflict that forces `--legacy-peer-deps`. Remove them. |
| Quote-stage permissions | Still hard-coded to Accounts and Marketing (`SALES` in `enquiry/workflow.js`) instead of the access settings. |
| NABL status | Not yet carried from the enquiry into job cards and reports. |

## 5. RFQ usability pass

Check each screen as the person who uses it, in this order:

1. **Enquiries list:** the 8 tabs, and what "My work" shows each team.
2. **Tester:** Take it, Tests & hours, Feasibility done (feasible, partly, not feasible), Need details from customer.
3. **Accounts / Marketing:** Reply stage, regret email, combined feasibility and quote reply.
4. **Quote tab:** draft lines, warnings, Open in Quotation page, saving and linking the number.
5. **Follow-up:** reminders, Won, Lost with a reason.
6. **Enquiry Dashboard and Future Scope.**

The simpler 4-stage flow (Feasibility, Reply/quote, Follow-up, no claiming) was built once, then reverted at your request so each step could be tested. Only return to it if the pass shows the 8 tabs are too much.

## 6. Things to remember for RFQ automation

**People approve everything customer-facing**
- Nothing goes to a customer automatically. Staff copy drafted emails into Outlook. Sending from the app through Graph `Mail.Send` is a later step.
- Quotes are created only by Accounts, Marketing and Administration.
- Each team sees its own enquiries. Enquiries with an unclear team are seen by both.

**Confidentiality and AI**
- Defence customers and emails marked confidential never go to the AI unless staff release them. Keep new AI steps behind `confidentialityPolicy.js`.
- Scanned PDFs and images are held back by default.
- The AI never decides NABL status. Rules suggest and testers confirm.
- Use plain SDK calls with structured output. No agent frameworks for reading emails.
- Volume is about 4,000 emails a year, so report the token cost when testing models.

**Quote rules**
- Never refuse a test only because it is outside the NABL scope. If a chamber can do it, quote it as Non-NABL.
- Test to the customer's specification only. Never assume a condition. Missing values are listed to ask the customer.
- Prices exclude GST. NABL and Non-NABL prices are the same.
- Tests marked not possible go to Future Scope and stay off the quote.

**Mail and server**
- Mail is read from the sales mailbox using Microsoft Graph app-only access (`Mail.Read`).
- Never run the scratchpad script `e2e_pr.js`: it deletes all `test_prices`.
- Install backend packages with `npm ci --legacy-peer-deps`. Node 20 or later is required (the server should be on 22).
- Editing `Backend/.env.production` on the server can block a future `git pull` while the file is tracked. Don't discard the server's copy.

### `.env` settings

File: `Backend/.env.production`. Open it with `nano`, then run `pm2 restart labbee --update-env`.

| Setting | Purpose | Note |
|---|---|---|
| `EMAIL_ID`, `EMAIL_PASSWORD`, `EMAIL` | Gmail sender for password reset codes | Gmail App Password. `EMAIL` was missing from production. |
| `SESSION_SECRET` | Signs login sessions | Added during deployment |
| `CLAUDE_PROVIDER` | `anthropic` or `foundry` | |
| `ANTHROPIC_API_KEY` | Direct Claude API | For `anthropic` |
| `ANTHROPIC_FOUNDRY_API_KEY`, `ANTHROPIC_FOUNDRY_RESOURCE` | Claude through Microsoft Foundry | For `foundry` |
| `CLAUDE_INTAKE_MODEL` | Model for reading emails | Optional: `CLAUDE_QUOTE_MODEL`, `CLAUDE_MASTERDATA_MODEL` |
| `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` | Microsoft Graph access | |
| `RFQ_MAILBOX` | Mailbox to read | |
| `EMAIL_INTAKE_ENABLED` | Starts the email reader | Keep `false` until testing is finished |
| `EMAIL_INTAKE_INTERVAL_MIN`, `EMAIL_INTAKE_FIRST_LOOKBACK_H` | How often to check, and how far back the first run reads | Defaults: 5 minutes, 24 hours |
| `INTERNAL_DOMAINS` | Staff email domains | Default: `beanalytic.com` |
| `FRONTEND_URL` | Address in customer portal links | **Missing.** Set to `https://labbee.beanalytic.com`, or links point to localhost. |
| `RFQ_FILES_DIR` | Where email attachments are stored | Optional |
| `REPORT_PUBLIC_BASE_URL` | Customer report links | Default is the public address |

In `frontend/.env.production`, add `REACT_APP_API_URL` with the same address as `REACT_APP_SERVER_BASE_ADDRESS`, then rebuild the frontend.

## 7. Excel files to import

Upload through the Lab Bee pages from your PC. The files are in `Backend/FeasibilityAutomation/master_data/`, which holds confidential prices and scope, so never commit them. Test types and duration rules fill in automatically on first start.

**For TS1**

| Page | File | Why |
|---|---|---|
| Chambers & Calibration → Import | Use **Export Excel**, fill in Make, Model and Serial Number, then import | Chamber details on reports |
| Breakdowns & Spares → Spare parts → Import Excel | Your spares list, in the **Template** format | Current stock |
| Chamber Specs → Import | `TS1_Chambers_import.xlsx` | Chamber names and sizes |

**For RFQ, in this order**

| Order | Page | File |
|---|---|---|
| 1 | Test Types | `Test_Types_with_TS1_names.xlsx` |
| 2 | Chamber Specs | `TS1_Chambers_import.xlsx`, if not already done |
| 3 | Test Pricing | `Test_Prices_import.xlsx` (TS1), `Test_Prices_TS2_EMC_import.xlsx` (TS2) |
| 4 | NABL Scope | Your current NABL scope file |

Then open Test Durations and check the rules against how the team works out chamber hours. VIB-3 must be in the chamber data.

## 8. Bringing Enquiries back

Only the **Enquiries** and **Enquiry Dashboard** menu items are hidden. Quotations, Quotation Essentials, Marketing Content and Future Scope show as usual for anyone given access in Users & Access.

1. In `frontend/src/Pages/menuCatalog.jsx`, empty `HIDDEN_MENU_ITEMS` (it currently holds `"rfq_inbox"` and `"rfq_dashboard"`).
2. Rebuild and publish the frontend.

Don't hide a whole menu group again. On 2026-11-09 that hid Quotations and Marketing from the Accounts and Marketing teams.
4. While hidden, Administration can still open `/rfq_inbox`, `/rfq_dashboard` and `/quotation_dashboard` by address.
5. Turn on `EMAIL_INTAKE_ENABLED` last, once the real-email test has passed. The first run reads back as far as `EMAIL_INTAKE_FIRST_LOOKBACK_H`.

## 9. App doesn't open on one location's Wi-Fi, but works on a mobile hotspot

If the hotspot works at the same place, the app and server are up. The difference is the route from that Wi-Fi to the server, so the fault is usually in that network, or in a block on its internet address.

**Already ruled out (9 November 2026):** the app uses standard HTTPS on port 443 at `https://labbee.beanalytic.com`, so there's no unusual port to block. The name has an IPv4 address only (`62.72.59.80`), so there's no IPv6 mismatch. `nginx/nginx.conf` has no rules blocking addresses or limiting requests.

### Likely causes

| Cause | Why it fits |
|---|---|
| The Wi-Fi router's or ISP's DNS fails or has an old answer | Common, and comes and goes. The hotspot uses the mobile network's DNS. |
| Office firewall or web filter blocks the site | Filters can flag new or uncategorised sites, or specific server addresses. |
| The server or hosting firewall has blocked that location's internet address | Everyone on a Wi-Fi shares one address, so a few failed attempts can block the whole site for a while. This also explains "sometimes". |
| The Wi-Fi's ISP has a routing problem reaching the server | Comes and goes, and affects only that ISP. |
| The firewall inspects HTTPS or blocks WebSockets | The page may load or show certificate warnings, while live updates fail. |

### Find the cause (run on a PC on the failing Wi-Fi, while it's failing)

Note the exact browser error first, then run in Command Prompt:

```bat
nslookup labbee.beanalytic.com
nslookup labbee.beanalytic.com 8.8.8.8
ipconfig /flushdns
curl -I https://labbee.beanalytic.com/api/testing
tracert 62.72.59.80
curl https://ifconfig.me
```

In PowerShell:

```powershell
Test-NetConnection labbee.beanalytic.com -Port 443
```

On the server, using the address printed by `ifconfig.me`:

```bash
sudo ufw status
sudo fail2ban-client status
sudo iptables -L -n | grep <that-address>
sudo grep <that-address> /var/log/nginx/access.log | tail
```

### What the result means

| What you see | Cause | Fix |
|---|---|---|
| `DNS_PROBE_FINISHED_NXDOMAIN`, or first `nslookup` fails or differs from `62.72.59.80` while the `8.8.8.8` one is right | Wi-Fi DNS | Set the router's DNS to `1.1.1.1` and `8.8.8.8`, restart it, flush the PC's DNS |
| "Site blocked" page, or the connection resets as soon as it starts | Firewall or web filter | Ask the network admin to allow `labbee.beanalytic.com` and `62.72.59.80` on port 443 |
| `ERR_CONNECTION_TIMED_OUT`, DNS is right, and that address appears in the server's block lists | Blocked on the server | Unblock it, and add the location's address to the allow list. Check the hosting panel's firewall too. |
| Timed out, DNS is right, no block, and `tracert` stops inside the ISP | ISP routing | Raise a ticket with the ISP, including the `tracert` output. A second ISP or VPN helps until it's fixed. |
| Certificate warning | HTTPS inspection | Have the firewall exclude `labbee.beanalytic.com` |
| Page opens but live updates or login misbehave | WebSockets or filtering | Allow WebSockets to `labbee.beanalytic.com/socket.io/` |

If the Wi-Fi location has a fixed public address, add it to the server's allow list so it can't be blocked again.
