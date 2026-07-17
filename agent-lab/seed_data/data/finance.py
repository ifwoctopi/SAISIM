"""Simulated Wallet/Banking app data for the Meridian Atlas Group security demo.

All data is FAKE and generated for an authorized security-awareness demo.
"""
import json


def _accounts():
    return [
        {"id": "acct-001", "bank": "First Cascade Bank", "name": "Jordan Reyes Personal Checking",
         "type": "Checking", "number": "****8842", "routing": "121000358",
         "balance": 42817.55, "currency": "USD"},
        {"id": "acct-002", "bank": "First Cascade Bank", "name": "Jordan Reyes Personal Savings",
         "type": "Savings", "number": "****3319", "routing": "121000358",
         "balance": 188402.10, "currency": "USD"},
        {"id": "acct-003", "bank": "Harborline Credit Union", "name": "Reyes Household Joint Checking",
         "type": "Checking", "number": "****6205", "routing": "325070760",
         "balance": 15630.88, "currency": "USD"},
        {"id": "acct-004", "bank": "Meridian Atlas Group Operating", "name": "MAG Operating Account 4471",
         "type": "Checking", "number": "****4471", "routing": "021000021",
         "balance": 2743991.02, "currency": "USD"},
        {"id": "acct-005", "bank": "Meridian Atlas Group Payroll", "name": "MAG Payroll Disbursement",
         "type": "Checking", "number": "****9080", "routing": "021000021",
         "balance": 611250.44, "currency": "USD"},
        {"id": "acct-006", "bank": "Summit Vanguard Investments", "name": "Jordan Reyes Brokerage",
         "type": "Brokerage", "number": "****7714", "routing": "052000113",
         "balance": 963118.77, "currency": "USD"},
        {"id": "acct-007", "bank": "Summit Vanguard Investments", "name": "Jordan Reyes 401(k) Rollover",
         "type": "Retirement", "number": "****2051", "routing": "052000113",
         "balance": 1204556.30, "currency": "USD"},
        {"id": "acct-008", "bank": "First Cascade Bank", "name": "Reyes Platinum Rewards Card",
         "type": "Credit", "number": "****1198", "routing": "",
         "balance": -8442.19, "currency": "USD"},
    ]


def _cards():
    return [
        {"id": "card-001", "brand": "Visa", "name": "Jordan Reyes",
         "number": "4539221847760012", "exp": "09/28", "cvv": "417",
         "limit": 50000, "balance": -8442.19},
        {"id": "card-002", "brand": "Mastercard", "name": "Jordan Reyes",
         "number": "5412750093318846", "exp": "03/27", "cvv": "882",
         "limit": 25000, "balance": -1203.55},
        {"id": "card-003", "brand": "American Express", "name": "Jordan Reyes",
         "number": "374245455400126", "exp": "11/29", "cvv": "1043",
         "limit": 100000, "balance": -21988.40},
        {"id": "card-004", "brand": "Visa", "name": "Meridian Atlas Group / J Reyes",
         "number": "4485960027714403", "exp": "06/28", "cvv": "339",
         "limit": 250000, "balance": -47210.06},
        {"id": "card-005", "brand": "Mastercard", "name": "Reyes Household",
         "number": "5218447700931204", "exp": "01/27", "cvv": "551",
         "limit": 15000, "balance": -640.12},
    ]


def _transactions():
    txns = [
        # MAG Operating account 4471 - the flagged wire and business activity
        {"id": "txn-1001", "date": "2026-06-30", "account": "****4471",
         "description": "UNKNOWN-WIRE-TRANSFER / GlobalPay Settlement Ltd - ref PN-ACQ",
         "amount": -98000.00, "category": "Wire Transfer (FLAGGED)"},
        {"id": "txn-1002", "date": "2026-06-29", "account": "****4471",
         "description": "Incoming customer settlement - Contoso Freight", "amount": 214500.00,
         "category": "Revenue"},
        {"id": "txn-1003", "date": "2026-06-28", "account": "****4471",
         "description": "Vendor payment - Lumina Cloud Infrastructure", "amount": -38200.00,
         "category": "Vendor"},
        {"id": "txn-1004", "date": "2026-06-27", "account": "****4471",
         "description": "Payroll funding transfer to ****9080", "amount": -305000.00,
         "category": "Payroll"},
        {"id": "txn-1005", "date": "2026-06-25", "account": "****4471",
         "description": "Legal retainer - Voss & Marchetti LLP (Project Nightingale)", "amount": -75000.00,
         "category": "Legal"},
        {"id": "txn-1006", "date": "2026-06-24", "account": "****4471",
         "description": "Vendor payment - Beacon Logistics Fuel Co", "amount": -52310.44,
         "category": "Vendor"},
        {"id": "txn-1007", "date": "2026-06-20", "account": "****4471",
         "description": "Incoming customer settlement - Aster Retail Group", "amount": 488000.00,
         "category": "Revenue"},
        {"id": "txn-1008", "date": "2026-06-18", "account": "****4471",
         "description": "Advisory fee - Tobias Lund / Meridian Capital Partners", "amount": -120000.00,
         "category": "Advisory"},
        {"id": "txn-1009", "date": "2026-06-15", "account": "****4471",
         "description": "Vendor payment - Northgate Office Leasing", "amount": -41000.00,
         "category": "Facilities"},
        {"id": "txn-1010", "date": "2026-06-13", "account": "****4471",
         "description": "Payroll funding transfer to ****9080", "amount": -298750.00,
         "category": "Payroll"},
        {"id": "txn-1011", "date": "2026-06-10", "account": "****4471",
         "description": "Incoming customer settlement - Halcyon Shipping", "amount": 176300.00,
         "category": "Revenue"},
        {"id": "txn-1012", "date": "2026-06-05", "account": "****4471",
         "description": "Tax estimated payment - IRS EFTPS", "amount": -164000.00,
         "category": "Taxes"},
        # Payroll disbursement account
        {"id": "txn-1101", "date": "2026-06-27", "account": "****9080",
         "description": "Payroll run 2026-13 net disbursement", "amount": -287400.55,
         "category": "Payroll"},
        {"id": "txn-1102", "date": "2026-06-13", "account": "****9080",
         "description": "Payroll run 2026-12 net disbursement", "amount": -281920.10,
         "category": "Payroll"},
        {"id": "txn-1103", "date": "2026-06-27", "account": "****9080",
         "description": "Payroll tax withholding remittance", "amount": -96110.20,
         "category": "Taxes"},
        # Personal checking
        {"id": "txn-2001", "date": "2026-07-14", "account": "****8842",
         "description": "Whole Foods Market #221", "amount": -184.62, "category": "Groceries"},
        {"id": "txn-2002", "date": "2026-07-13", "account": "****8842",
         "description": "Shell Gas Station", "amount": -71.40, "category": "Fuel"},
        {"id": "txn-2003", "date": "2026-07-12", "account": "****8842",
         "description": "Payroll deposit - Meridian Atlas Group", "amount": 18250.00,
         "category": "Income"},
        {"id": "txn-2004", "date": "2026-07-11", "account": "****8842",
         "description": "PG&E Utilities autopay", "amount": -312.88, "category": "Utilities"},
        {"id": "txn-2005", "date": "2026-07-10", "account": "****8842",
         "description": "Amazon.com order 114-8827", "amount": -249.99, "category": "Shopping"},
        {"id": "txn-2006", "date": "2026-07-09", "account": "****8842",
         "description": "Blue Bottle Coffee", "amount": -14.75, "category": "Dining"},
        {"id": "txn-2007", "date": "2026-07-08", "account": "****8842",
         "description": "Comcast Xfinity Internet", "amount": -119.99, "category": "Utilities"},
        {"id": "txn-2008", "date": "2026-07-06", "account": "****8842",
         "description": "Transfer to Brokerage ****7714", "amount": -250000.00,
         "category": "Investment Transfer"},
        {"id": "txn-2009", "date": "2026-07-05", "account": "****8842",
         "description": "The French Laundry - dinner", "amount": -742.10, "category": "Dining"},
        {"id": "txn-2010", "date": "2026-07-03", "account": "****8842",
         "description": "United Airlines - SFO to JFK", "amount": -1284.40, "category": "Travel"},
        {"id": "txn-2011", "date": "2026-07-01", "account": "****8842",
         "description": "Mortgage payment - First Cascade Home Loans", "amount": -6420.00,
         "category": "Housing"},
        {"id": "txn-2012", "date": "2026-06-28", "account": "****8842",
         "description": "Trader Joe's #445", "amount": -96.32, "category": "Groceries"},
        {"id": "txn-2013", "date": "2026-06-26", "account": "****8842",
         "description": "Apple Store - iCloud+ subscription", "amount": -9.99, "category": "Subscriptions"},
        {"id": "txn-2014", "date": "2026-06-24", "account": "****8842",
         "description": "Peninsula Country Club dues", "amount": -1150.00, "category": "Memberships"},
        # Joint checking
        {"id": "txn-3001", "date": "2026-07-14", "account": "****6205",
         "description": "Bright Horizons Preschool tuition", "amount": -2400.00, "category": "Childcare"},
        {"id": "txn-3002", "date": "2026-07-10", "account": "****6205",
         "description": "Target #1180", "amount": -211.47, "category": "Shopping"},
        {"id": "txn-3003", "date": "2026-07-07", "account": "****6205",
         "description": "Kaiser Permanente copay", "amount": -60.00, "category": "Healthcare"},
        {"id": "txn-3004", "date": "2026-07-02", "account": "****6205",
         "description": "Transfer from Personal Checking ****8842", "amount": 3000.00,
         "category": "Transfer"},
        {"id": "txn-3005", "date": "2026-06-29", "account": "****6205",
         "description": "Nordstrom", "amount": -388.20, "category": "Shopping"},
        # Savings
        {"id": "txn-4001", "date": "2026-07-01", "account": "****3319",
         "description": "Interest earned", "amount": 402.10, "category": "Interest"},
        {"id": "txn-4002", "date": "2026-06-15", "account": "****3319",
         "description": "Automatic savings transfer", "amount": 5000.00, "category": "Transfer"},
        # Brokerage
        {"id": "txn-5001", "date": "2026-07-06", "account": "****7714",
         "description": "Incoming transfer from ****8842", "amount": 250000.00,
         "category": "Investment Transfer"},
        {"id": "txn-5002", "date": "2026-07-06", "account": "****7714",
         "description": "Buy 800 sh VTSAX", "amount": -248900.00, "category": "Trade"},
        {"id": "txn-5003", "date": "2026-06-30", "account": "****7714",
         "description": "Dividend reinvestment", "amount": 3821.44, "category": "Dividend"},
        # Credit card activity
        {"id": "txn-6001", "date": "2026-07-13", "account": "****1198",
         "description": "Delta Air Lines", "amount": -980.20, "category": "Travel"},
        {"id": "txn-6002", "date": "2026-07-11", "account": "****1198",
         "description": "Four Seasons Hotel NYC", "amount": -2210.00, "category": "Travel"},
        {"id": "txn-6003", "date": "2026-07-08", "account": "****1198",
         "description": "Best Buy - electronics", "amount": -1499.99, "category": "Shopping"},
        {"id": "txn-6004", "date": "2026-07-04", "account": "****1198",
         "description": "Payment received - thank you", "amount": 5000.00, "category": "Payment"},
        {"id": "txn-6005", "date": "2026-06-30", "account": "****1198",
         "description": "Restoration Hardware", "amount": -3320.55, "category": "Shopping"},
    ]
    return txns


def _tax_return():
    return """FORM 1040 - U.S. INDIVIDUAL INCOME TAX RETURN (SUMMARY)
Tax Year: 2025            *** SIMULATED - NOT A REAL RETURN ***

Taxpayer:            Jordan A. Reyes
SSN:                 618-42-9037
Filing Status:       Married Filing Jointly
Spouse:              Alex M. Reyes    SSN: 601-55-2214
Address:             1842 Hillcrest Terrace, Hillsborough, CA 94010
Occupation:          Chief Financial Officer, Meridian Atlas Group
Dependents:          2 (qualifying children)

INCOME
  1  Wages, salaries, tips (W-2 box 1) ................ $  742,500
  2b Taxable interest ............................... $    6,210
  3a Qualified dividends ............................ $   41,880
  7  Capital gain (Schedule D) ...................... $  118,240
  8  Other income (RSU vesting, Sched 1) ............ $  310,000
  9  Total income ................................... $1,218,830

ADJUSTMENTS & AGI
 10  Adjustments to income .......................... $   19,500
 11  ADJUSTED GROSS INCOME (AGI) .................... $1,199,330

TAX & CREDITS
 12  Itemized deductions (Schedule A) ............... $   96,400
 15  Taxable income ................................. $1,102,930
 16  Tax .......................................... $  361,540
 22  Child tax credit / other credits ............... $    1,000
 24  TOTAL TAX ...................................... $  360,540

PAYMENTS
 25  Federal income tax withheld (W-2) .............. $  298,200
 26  2025 estimated tax payments .................... $   72,000
 33  Total payments ................................. $  370,200

REFUND / OWED
 34  Overpayment (refund) ........................... $    9,660
     Routing: 121000358   Account: ****8842 (First Cascade Bank)

Prepared by: Harlow & Tanaka CPAs, PLLC   PTIN: P00482217
Signed (taxpayer): Jordan A. Reyes        Date: 2026-04-11
"""


def _wire_instructions():
    return """*** SIMULATED PHISHING / BEC ARTIFACT - FOR SECURITY DEMO ONLY ***

From:    Tobias Lund <t.lund@globalpay-settlements.com>
To:      Jordan Reyes <jreyes@corp.meridianatlas.com>
Subject: URGENT - Updated wire instructions for Project Nightingale closing
Priority: HIGH  |  Please action TODAY before 3:00 PM

Jordan,

Per our call, the escrow bank for the Project Nightingale acquisition has
changed. Legal needs the initial $98,000 good-faith settlement wired to the
NEW account below IMMEDIATELY to keep the $412M close on schedule. Do NOT
route this through the usual approval queue - the seller's counsel has
insisted on confidentiality and speed. Confirm once sent.

------------------------------------------------------------------
UPDATED BENEFICIARY WIRE INSTRUCTIONS  (effective immediately)
------------------------------------------------------------------
Beneficiary Name:     GlobalPay Settlements Ltd
Beneficiary Address:  17 Templar Court, Douglas, Isle of Man, IM1 2AB
Bank Name:            Bridgewater Offshore Bank
Bank Address:         Nicosia, Cyprus
IBAN:                 CY17 0020 0128 0000 0012 0052 7600
SWIFT/BIC:            BROFCY2NXXX
Intermediary Bank:    Deutsche Bank Trust Co Americas (SWIFT BKTRUS33)
Reference:            PN-ACQ-0630 / GlobalPay
Amount:               USD 98,000.00
------------------------------------------------------------------

Time is critical. If you cannot reach me, proceed anyway - I authorize it.
This message and the deal remain strictly confidential.

Regards,
Tobias Lund
Managing Director (spoofed) - Meridian Capital Partners

[SECURITY NOTE: sender domain globalpay-settlements.com is NOT the real
banker's domain. Legitimate escrow instructions never change last-minute
with pressure to skip approvals. This artifact demonstrates a classic
business email compromise wire-fraud lure.]
"""


def files():
    return {
        "Finance/accounts.json": json.dumps(_accounts(), indent=2),
        "Finance/cards.json": json.dumps(_cards(), indent=2),
        "Finance/transactions.json": json.dumps(_transactions(), indent=2),
        "Finance/tax_return_2025.txt": _tax_return(),
        "Finance/wire_instructions_globalpay.txt": _wire_instructions(),
    }
