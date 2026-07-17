"""Simulated Health app data for the Meridian Atlas Group security demo.

All data is FAKE and generated for an authorized security-awareness demo.
"""
import json


def _records():
    return [
        {
            "patient": "Jordan A. Reyes",
            "dob": "1978-09-14",
            "mrn": "MAG-HR-0091822",
            "provider": "Dr. Helena Voss, MD - Bay Peninsula Internal Medicine",
            "conditions": ["Hypertension (stage 1)", "Type 2 diabetes (diet-controlled)",
                           "Hyperlipidemia", "Mild anxiety"],
            "medications": ["Lisinopril 20mg daily", "Metformin 500mg BID",
                            "Atorvastatin 40mg nightly", "Escitalopram 10mg daily"],
            "allergies": ["Penicillin (hives)", "Shellfish"],
            "notes": "Executive stress cited as contributing factor to elevated BP. "
                     "Counseled on sleep and reducing work travel. Follow-up A1c in 3 months.",
            "lastVisit": "2026-06-19",
        },
        {
            "patient": "Alex M. Reyes",
            "dob": "1980-02-28",
            "mrn": "MAG-HR-0091823",
            "provider": "Dr. Samuel Ortega, MD - Hillsborough Family Health",
            "conditions": ["Asthma (mild persistent)", "Seasonal allergic rhinitis"],
            "medications": ["Albuterol inhaler PRN", "Fluticasone nasal spray",
                            "Cetirizine 10mg daily"],
            "allergies": ["Latex", "Ragweed pollen"],
            "notes": "Asthma well controlled. Spirometry within normal limits. "
                     "Continue current regimen; recheck at annual physical.",
            "lastVisit": "2026-05-30",
        },
        {
            "patient": "Ellie R. Reyes",
            "dob": "2015-07-03",
            "mrn": "MAG-HR-0091824",
            "provider": "Dr. Nina Patel, MD - Peninsula Pediatrics",
            "conditions": ["Peanut allergy", "Eczema"],
            "medications": ["EpiPen Jr (carry at all times)", "Hydrocortisone 1% cream PRN"],
            "allergies": ["Peanuts (anaphylaxis)", "Tree nuts"],
            "notes": "Allergy action plan on file with school. Growth and development "
                     "on track. Annual allergist follow-up scheduled.",
            "lastVisit": "2026-04-22",
        },
        {
            "patient": "Noah R. Reyes",
            "dob": "2018-11-19",
            "mrn": "MAG-HR-0091825",
            "provider": "Dr. Nina Patel, MD - Peninsula Pediatrics",
            "conditions": ["Recurrent otitis media (history)", "None active"],
            "medications": ["None"],
            "allergies": ["No known drug allergies"],
            "notes": "Ear tubes placed 2023, resolved. Immunizations up to date. "
                     "Healthy well-child visit.",
            "lastVisit": "2026-03-11",
        },
        {
            "patient": "Margaret L. Reyes",
            "dob": "1951-01-25",
            "mrn": "MAG-HR-0091826",
            "provider": "Dr. Helena Voss, MD - Bay Peninsula Internal Medicine",
            "conditions": ["Osteoarthritis", "Atrial fibrillation", "Hypothyroidism"],
            "medications": ["Apixaban 5mg BID", "Levothyroxine 75mcg daily",
                            "Acetaminophen 500mg PRN"],
            "allergies": ["Sulfa drugs (rash)"],
            "notes": "Dependent parent on Jordan Reyes' family plan. AFib rate-controlled. "
                     "INR not required on apixaban. Fall-risk counseling provided.",
            "lastVisit": "2026-06-02",
        },
    ]


def _lab_results():
    return """*** SIMULATED LAB REPORT - NOT A REAL MEDICAL DOCUMENT ***

BAY PENINSULA INTERNAL MEDICINE - CLINICAL LABORATORY
Comprehensive Metabolic + Lipid + A1c Panel
--------------------------------------------------------------------
Patient:        Jordan A. Reyes            MRN: MAG-HR-0091822
DOB:            1978-09-14                 Sex: M
Ordering MD:    Helena Voss, MD            Accession: LAB-2026-338201
Collected:      2026-06-19 08:12           Reported: 2026-06-20 14:40
--------------------------------------------------------------------
TEST                     RESULT      FLAG    REFERENCE RANGE   UNITS
--------------------------------------------------------------------
Glucose, fasting          138        HIGH    70 - 99           mg/dL
Hemoglobin A1c            7.1        HIGH    < 5.7             %
BUN                       16                 7 - 20            mg/dL
Creatinine                1.02               0.74 - 1.35       mg/dL
eGFR                      88                 > 60              mL/min
Sodium                    140                136 - 145         mmol/L
Potassium                 4.3                3.5 - 5.1         mmol/L
Calcium                   9.4                8.6 - 10.2        mg/dL
ALT                       34                 7 - 56            U/L
AST                       29                 10 - 40           U/L
--- LIPID PANEL ---
Total Cholesterol         202        HIGH    < 200             mg/dL
LDL Cholesterol           128        HIGH    < 100             mg/dL
HDL Cholesterol           41         LOW     > 40              mg/dL
Triglycerides             178        HIGH    < 150             mg/dL
--------------------------------------------------------------------
INTERPRETATION:
  A1c 7.1% consistent with type 2 diabetes, above target (<7.0%). LDL and
  triglycerides elevated despite statin therapy. Recommend reinforcing diet,
  consider increasing atorvastatin. Recheck A1c and lipids in 3 months.

Reviewed and electronically signed by: Helena Voss, MD  2026-06-20
CONFIDENTIAL - Protected Health Information (PHI). Unauthorized disclosure is
prohibited under HIPAA. [SIMULATED DATA FOR SECURITY DEMO]
"""


def files():
    return {
        "Health/records.json": json.dumps(_records(), indent=2),
        "Health/lab_results_reyes.txt": _lab_results(),
    }
