from database import SessionLocal, Base, engine, Facility, Medicine, User, FacilityType, ExpiryStatus
from scheduler import calculate_expiry_status
from datetime import date, timedelta
import hashlib

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

print("Seeding facilities...")
facilities_data = [
    {
        "name": "King George Hospital (KGH)",
        "facility_type": FacilityType.government_hospital,
        "address": "Maharanipeta, Visakhapatnam",
        "area": "Maharanipeta",
        "latitude": 17.7172, "longitude": 83.3013,
        "phone": "0891-2564891",
        "email": "pharmacy@kghvizag.gov.in",
        "admin_whatsapp": "+919876543210",
        "is_free_medicines": True,
    },
    {
        "name": "VIMSAR Outpatient Pharmacy",
        "facility_type": FacilityType.government_hospital,
        "address": "Asilmetta, Visakhapatnam",
        "area": "Asilmetta",
        "latitude": 17.7326, "longitude": 83.3180,
        "phone": "0891-2755555",
        "email": "pharmacy@vimsar.gov.in",
        "admin_whatsapp": "+919876543211",
        "is_free_medicines": True,
    },
    {
        "name": "Government Area Hospital, Gajuwaka",
        "facility_type": FacilityType.phc,
        "address": "Gajuwaka, Visakhapatnam",
        "area": "Gajuwaka",
        "latitude": 17.6868, "longitude": 83.2185,
        "phone": "0891-2518100",
        "email": "areahospital.gjk@gov.in",
        "admin_whatsapp": "+919876543212",
        "is_free_medicines": True,
    },
    {
        "name": "Apollo Pharmacy, Dwaraka Nagar",
        "facility_type": FacilityType.private_pharmacy,
        "address": "Dwaraka Nagar, Visakhapatnam",
        "area": "Dwaraka Nagar",
        "latitude": 17.7247, "longitude": 83.3136,
        "phone": "0891-2763100",
        "email": "dwaraka@apollopharmacy.in",
        "admin_whatsapp": "+919876543213",
        "is_free_medicines": False,
    },
    {
        "name": "MedPlus Pharmacy, MVP Colony",
        "facility_type": FacilityType.private_pharmacy,
        "address": "MVP Colony, Visakhapatnam",
        "area": "MVP Colony",
        "latitude": 17.7435, "longitude": 83.2965,
        "phone": "0891-2714200",
        "email": "mvp@medplus.in",
        "admin_whatsapp": "+919876543214",
        "is_free_medicines": False,
    },
    {
        "name": "Care Hospitals Pharmacy, Waltair",
        "facility_type": FacilityType.private_hospital,
        "address": "Waltair Main Road, Visakhapatnam",
        "area": "Waltair",
        "latitude": 17.7289, "longitude": 83.3342,
        "phone": "0891-6766666",
        "email": "pharmacy@carehospitals.com",
        "admin_whatsapp": "+919876543215",
        "is_free_medicines": False,
    },
]

facility_objs = []
for f in facilities_data:
    existing = db.query(Facility).filter(Facility.name == f["name"]).first()
    if not existing:
        obj = Facility(**f)
        db.add(obj)
        db.flush()
        facility_objs.append(obj)
    else:
        facility_objs.append(existing)
db.commit()
print(f"  {len(facility_objs)} facilities ready.")

today = date.today()
def exp(days): return today + timedelta(days=days)
def mfg(days): return today - timedelta(days=days)

print("Seeding medicines...")
medicines_data = [
    # ── KGH (facility_objs[0]) ─────────────────────────────────────────
    # SAFE
    {"facility_id": facility_objs[0].id, "name": "Paracetamol 500mg", "generic_name": "paracetamol", "category": "Analgesic", "batch_number": "BN-KGH-001", "supplier": "Cipla Ltd", "quantity": 1200, "mrp": 1.5, "expiry_date": exp(300), "manufacturing_date": mfg(65)},
    {"facility_id": facility_objs[0].id, "name": "Amoxicillin 500mg", "generic_name": "amoxicillin", "category": "Antibiotic", "batch_number": "BN-KGH-002", "supplier": "Sun Pharma", "quantity": 600, "mrp": 8.5, "expiry_date": exp(240), "manufacturing_date": mfg(120)},
    {"facility_id": facility_objs[0].id, "name": "Metformin 500mg", "generic_name": "metformin", "category": "Antidiabetic", "batch_number": "BN-KGH-003", "supplier": "Dr. Reddys", "quantity": 800, "mrp": 3.2, "expiry_date": exp(180), "manufacturing_date": mfg(180)},
    {"facility_id": facility_objs[0].id, "name": "Atorvastatin 10mg", "generic_name": "atorvastatin", "category": "Cardiovascular", "batch_number": "BN-KGH-004", "supplier": "Lupin Ltd", "quantity": 400, "mrp": 6.0, "expiry_date": exp(210), "manufacturing_date": mfg(150)},
    {"facility_id": facility_objs[0].id, "name": "Amlodipine 5mg", "generic_name": "amlodipine", "category": "Cardiovascular", "batch_number": "BN-KGH-005", "supplier": "Cipla Ltd", "quantity": 350, "mrp": 4.5, "expiry_date": exp(270), "manufacturing_date": mfg(90)},
    {"facility_id": facility_objs[0].id, "name": "Insulin Glargine 100IU", "generic_name": "insulin glargine", "category": "Antidiabetic", "batch_number": "BN-KGH-006", "supplier": "Sanofi", "quantity": 50, "mrp": 850.0, "expiry_date": exp(120), "manufacturing_date": mfg(60), "is_cold_chain": True},
    {"facility_id": facility_objs[0].id, "name": "Azithromycin 500mg", "generic_name": "azithromycin", "category": "Antibiotic", "batch_number": "BN-KGH-007", "supplier": "Cipla Ltd", "quantity": 300, "mrp": 45.0, "expiry_date": exp(365), "manufacturing_date": mfg(30)},
    {"facility_id": facility_objs[0].id, "name": "Pantoprazole 40mg", "generic_name": "pantoprazole", "category": "Gastrointestinal", "batch_number": "BN-KGH-008", "supplier": "Torrent Pharma", "quantity": 500, "mrp": 5.5, "expiry_date": exp(200), "manufacturing_date": mfg(160)},
    {"facility_id": facility_objs[0].id, "name": "Cetirizine 10mg", "generic_name": "cetirizine", "category": "Antihistamine", "batch_number": "BN-KGH-009", "supplier": "Mankind Pharma", "quantity": 700, "mrp": 2.0, "expiry_date": exp(310), "manufacturing_date": mfg(50)},
    {"facility_id": facility_objs[0].id, "name": "Vitamin D3 60000IU", "generic_name": "cholecalciferol", "category": "Vitamin", "batch_number": "BN-KGH-010", "supplier": "Alkem Labs", "quantity": 200, "mrp": 22.0, "expiry_date": exp(400), "manufacturing_date": mfg(20)},
    # WARNING (31-60 days)
    {"facility_id": facility_objs[0].id, "name": "Ciprofloxacin 500mg", "generic_name": "ciprofloxacin", "category": "Antibiotic", "batch_number": "BN-KGH-011", "supplier": "Hetero Drugs", "quantity": 250, "mrp": 12.0, "expiry_date": exp(45), "manufacturing_date": mfg(315)},
    {"facility_id": facility_objs[0].id, "name": "Doxycycline 100mg", "generic_name": "doxycycline", "category": "Antibiotic", "batch_number": "BN-KGH-012", "supplier": "Hetero Drugs", "quantity": 180, "mrp": 9.5, "expiry_date": exp(38), "manufacturing_date": mfg(322)},
    {"facility_id": facility_objs[0].id, "name": "Omeprazole 20mg", "generic_name": "omeprazole", "category": "Gastrointestinal", "batch_number": "BN-KGH-013", "supplier": "Sun Pharma", "quantity": 320, "mrp": 4.0, "expiry_date": exp(55), "manufacturing_date": mfg(305)},
    # CRITICAL (<=30 days) — surplus for redistribution demo
    {"facility_id": facility_objs[0].id, "name": "Ibuprofen 400mg", "generic_name": "ibuprofen", "category": "Analgesic/Anti-inflammatory", "batch_number": "BN-KGH-014", "supplier": "IPCA Labs", "quantity": 450, "mrp": 3.5, "expiry_date": exp(22), "manufacturing_date": mfg(338)},
    {"facility_id": facility_objs[0].id, "name": "Ranitidine 150mg", "generic_name": "ranitidine", "category": "Gastrointestinal", "batch_number": "BN-KGH-015", "supplier": "GSK", "quantity": 190, "mrp": 4.2, "expiry_date": exp(15), "manufacturing_date": mfg(345)},
    {"facility_id": facility_objs[0].id, "name": "Folic Acid 5mg", "generic_name": "folic acid", "category": "Vitamin", "batch_number": "BN-KGH-016", "supplier": "Alkem Labs", "quantity": 380, "mrp": 1.8, "expiry_date": exp(8), "manufacturing_date": mfg(352)},
    # EXPIRED
    {"facility_id": facility_objs[0].id, "name": "Cotrimoxazole 480mg", "generic_name": "cotrimoxazole", "category": "Antibiotic", "batch_number": "BN-KGH-017", "supplier": "Alkem Labs", "quantity": 120, "mrp": 5.0, "expiry_date": exp(-10), "manufacturing_date": mfg(370)},
    {"facility_id": facility_objs[0].id, "name": "Chlorpheniramine 4mg", "generic_name": "chlorpheniramine", "category": "Antihistamine", "batch_number": "BN-KGH-018", "supplier": "Neon Labs", "quantity": 200, "mrp": 1.5, "expiry_date": exp(-5), "manufacturing_date": mfg(365)},

    # ── VIMSAR (facility_objs[1]) ───────────────────────────────────────
    {"facility_id": facility_objs[1].id, "name": "Paracetamol 500mg", "generic_name": "paracetamol", "category": "Analgesic", "batch_number": "BN-VIM-001", "supplier": "Cipla Ltd", "quantity": 900, "mrp": 1.5, "expiry_date": exp(280), "manufacturing_date": mfg(80)},
    {"facility_id": facility_objs[1].id, "name": "Metformin 850mg", "generic_name": "metformin", "category": "Antidiabetic", "batch_number": "BN-VIM-002", "supplier": "USV Ltd", "quantity": 500, "mrp": 5.0, "expiry_date": exp(190), "manufacturing_date": mfg(170)},
    {"facility_id": facility_objs[1].id, "name": "Amlodipine 5mg", "generic_name": "amlodipine", "category": "Cardiovascular", "batch_number": "BN-VIM-003", "supplier": "Cipla Ltd", "quantity": 300, "mrp": 4.5, "expiry_date": exp(150), "manufacturing_date": mfg(210)},
    {"facility_id": facility_objs[1].id, "name": "Ibuprofen 400mg", "generic_name": "ibuprofen", "category": "Analgesic/Anti-inflammatory", "batch_number": "BN-VIM-004", "supplier": "IPCA Labs", "quantity": 14, "mrp": 3.5, "expiry_date": exp(180), "manufacturing_date": mfg(180)},
    {"facility_id": facility_objs[1].id, "name": "Salbutamol 2mg", "generic_name": "salbutamol", "category": "Respiratory", "batch_number": "BN-VIM-005", "supplier": "GSK", "quantity": 200, "mrp": 8.0, "expiry_date": exp(25), "manufacturing_date": mfg(335)},
    {"facility_id": facility_objs[1].id, "name": "Diclofenac 50mg", "generic_name": "diclofenac", "category": "Analgesic/Anti-inflammatory", "batch_number": "BN-VIM-006", "supplier": "Novartis", "quantity": 160, "mrp": 6.0, "expiry_date": exp(42), "manufacturing_date": mfg(318)},
    {"facility_id": facility_objs[1].id, "name": "Glimepiride 1mg", "generic_name": "glimepiride", "category": "Antidiabetic", "batch_number": "BN-VIM-007", "supplier": "Sanofi", "quantity": 90, "mrp": 12.5, "expiry_date": exp(-3), "manufacturing_date": mfg(363)},

    # ── Gajuwaka Govt Hospital (facility_objs[2]) ───────────────────────
    {"facility_id": facility_objs[2].id, "name": "Paracetamol 500mg", "generic_name": "paracetamol", "category": "Analgesic", "batch_number": "BN-GJK-001", "supplier": "Neon Labs", "quantity": 400, "mrp": 1.5, "expiry_date": exp(260), "manufacturing_date": mfg(100)},
    {"facility_id": facility_objs[2].id, "name": "Amoxicillin 250mg", "generic_name": "amoxicillin", "category": "Antibiotic", "batch_number": "BN-GJK-002", "supplier": "Neon Labs", "quantity": 10, "mrp": 5.5, "expiry_date": exp(200), "manufacturing_date": mfg(160)},
    {"facility_id": facility_objs[2].id, "name": "ORS Sachet", "generic_name": "oral rehydration salts", "category": "Electrolyte", "batch_number": "BN-GJK-003", "supplier": "Neon Labs", "quantity": 500, "mrp": 5.0, "expiry_date": exp(365), "manufacturing_date": mfg(30)},
    {"facility_id": facility_objs[2].id, "name": "Ibuprofen 400mg", "generic_name": "ibuprofen", "category": "Analgesic/Anti-inflammatory", "batch_number": "BN-GJK-004", "supplier": "IPCA Labs", "quantity": 8, "mrp": 3.5, "expiry_date": exp(200), "manufacturing_date": mfg(160)},
    {"facility_id": facility_objs[2].id, "name": "Iron Folic Acid Tablet", "generic_name": "ferrous sulphate folic acid", "category": "Supplement", "batch_number": "BN-GJK-005", "supplier": "Alkem Labs", "quantity": 600, "mrp": 2.0, "expiry_date": exp(18), "manufacturing_date": mfg(342)},
    {"facility_id": facility_objs[2].id, "name": "Zinc Sulphate 20mg", "generic_name": "zinc sulphate", "category": "Supplement", "batch_number": "BN-GJK-006", "supplier": "Alkem Labs", "quantity": 300, "mrp": 1.5, "expiry_date": exp(-8), "manufacturing_date": mfg(368)},

    # ── Apollo Pharmacy (facility_objs[3]) ─────────────────────────────
    {"facility_id": facility_objs[3].id, "name": "Dolo 650", "generic_name": "paracetamol", "category": "Analgesic", "batch_number": "BN-APL-001", "supplier": "Micro Labs", "quantity": 800, "mrp": 30.0, "expiry_date": exp(400), "manufacturing_date": mfg(10)},
    {"facility_id": facility_objs[3].id, "name": "Augmentin 625mg", "generic_name": "amoxicillin clavulanate", "category": "Antibiotic", "batch_number": "BN-APL-002", "supplier": "GSK", "quantity": 200, "mrp": 185.0, "expiry_date": exp(380), "manufacturing_date": mfg(20)},
    {"facility_id": facility_objs[3].id, "name": "Pan D", "generic_name": "pantoprazole domperidone", "category": "Gastrointestinal", "batch_number": "BN-APL-003", "supplier": "Alkem Labs", "quantity": 400, "mrp": 95.0, "expiry_date": exp(350), "manufacturing_date": mfg(40)},
    {"facility_id": facility_objs[3].id, "name": "Telma 40", "generic_name": "telmisartan", "category": "Cardiovascular", "batch_number": "BN-APL-004", "supplier": "Glenmark", "quantity": 150, "mrp": 110.0, "expiry_date": exp(300), "manufacturing_date": mfg(60)},
    {"facility_id": facility_objs[3].id, "name": "Allegra 120mg", "generic_name": "fexofenadine", "category": "Antihistamine", "batch_number": "BN-APL-005", "supplier": "Sanofi", "quantity": 300, "mrp": 75.0, "expiry_date": exp(28), "manufacturing_date": mfg(332)},
    {"facility_id": facility_objs[3].id, "name": "Insulin Regular 40IU", "generic_name": "insulin regular", "category": "Antidiabetic", "batch_number": "BN-APL-006", "supplier": "Novo Nordisk", "quantity": 25, "mrp": 120.0, "expiry_date": exp(90), "manufacturing_date": mfg(270), "is_cold_chain": True},

    # ── MedPlus (facility_objs[4]) ──────────────────────────────────────
    {"facility_id": facility_objs[4].id, "name": "Dolo 650", "generic_name": "paracetamol", "category": "Analgesic", "batch_number": "BN-MED-001", "supplier": "Micro Labs", "quantity": 1000, "mrp": 30.0, "expiry_date": exp(420), "manufacturing_date": mfg(5)},
    {"facility_id": facility_objs[4].id, "name": "Glycomet 500", "generic_name": "metformin", "category": "Antidiabetic", "batch_number": "BN-MED-002", "supplier": "USV Ltd", "quantity": 600, "mrp": 55.0, "expiry_date": exp(360), "manufacturing_date": mfg(30)},
    {"facility_id": facility_objs[4].id, "name": "Combiflam", "generic_name": "ibuprofen paracetamol", "category": "Analgesic/Anti-inflammatory", "batch_number": "BN-MED-003", "supplier": "Sanofi", "quantity": 500, "mrp": 28.0, "expiry_date": exp(300), "manufacturing_date": mfg(60)},
    {"facility_id": facility_objs[4].id, "name": "Omez 20", "generic_name": "omeprazole", "category": "Gastrointestinal", "batch_number": "BN-MED-004", "supplier": "Dr. Reddys", "quantity": 400, "mrp": 42.0, "expiry_date": exp(50), "manufacturing_date": mfg(310)},
    {"facility_id": facility_objs[4].id, "name": "Cetzine 10mg", "generic_name": "cetirizine", "category": "Antihistamine", "batch_number": "BN-MED-005", "supplier": "UCB India", "quantity": 350, "mrp": 18.0, "expiry_date": exp(280), "manufacturing_date": mfg(80)},
    {"facility_id": facility_objs[4].id, "name": "Taxim-O 200mg", "generic_name": "cefixime", "category": "Antibiotic", "batch_number": "BN-MED-006", "supplier": "Alkem Labs", "quantity": 200, "mrp": 145.0, "expiry_date": exp(12), "manufacturing_date": mfg(348)},

    # ── Care Hospitals (facility_objs[5]) ───────────────────────────────
    {"facility_id": facility_objs[5].id, "name": "Paracetamol 500mg", "generic_name": "paracetamol", "category": "Analgesic", "batch_number": "BN-CAR-001", "supplier": "Cipla Ltd", "quantity": 700, "mrp": 1.5, "expiry_date": exp(330), "manufacturing_date": mfg(30)},
    {"facility_id": facility_objs[5].id, "name": "Cefuroxime 500mg", "generic_name": "cefuroxime", "category": "Antibiotic", "batch_number": "BN-CAR-002", "supplier": "GSK", "quantity": 100, "mrp": 95.0, "expiry_date": exp(250), "manufacturing_date": mfg(110)},
    {"facility_id": facility_objs[5].id, "name": "Heparin 5000IU", "generic_name": "heparin", "category": "Anticoagulant", "batch_number": "BN-CAR-003", "supplier": "Pfizer", "quantity": 80, "mrp": 420.0, "expiry_date": exp(160), "manufacturing_date": mfg(200), "is_cold_chain": True},
    {"facility_id": facility_objs[5].id, "name": "Enalapril 5mg", "generic_name": "enalapril", "category": "Cardiovascular", "batch_number": "BN-CAR-004", "supplier": "Lupin Ltd", "quantity": 250, "mrp": 8.5, "expiry_date": exp(26), "manufacturing_date": mfg(334)},
    {"facility_id": facility_objs[5].id, "name": "Losartan 50mg", "generic_name": "losartan", "category": "Cardiovascular", "batch_number": "BN-CAR-005", "supplier": "Lupin Ltd", "quantity": 200, "mrp": 15.0, "expiry_date": exp(190), "manufacturing_date": mfg(170)},
    {"facility_id": facility_objs[5].id, "name": "Hydrocortisone 100mg", "generic_name": "hydrocortisone", "category": "Corticosteroid", "batch_number": "BN-CAR-006", "supplier": "Pfizer", "quantity": 60, "mrp": 85.0, "expiry_date": exp(-15), "manufacturing_date": mfg(375)},
]

for m in medicines_data:
    exp_date = m.pop("expiry_date")
    mfg_date = m.pop("manufacturing_date", None)
    is_cold = m.pop("is_cold_chain", False)
    status, days = calculate_expiry_status(exp_date)
    med = Medicine(
        **m,
        expiry_date=exp_date,
        manufacturing_date=mfg_date,
        expiry_status=status,
        days_remaining=days,
        is_cold_chain=is_cold
    )
    db.add(med)

db.commit()
print(f"  {len(medicines_data)} medicines seeded.")

print("Seeding users...")
users_data = [
    {"facility_id": facility_objs[0].id, "name": "Dr. Ramesh Babu", "email": "admin@kgh.in", "password": "kgh@2024"},
    {"facility_id": facility_objs[1].id, "name": "Dr. Lakshmi Prasad", "email": "admin@vimsar.in", "password": "vimsar@2024"},
    {"facility_id": facility_objs[2].id, "name": "K. Srinivas", "email": "admin@gajuwaka.in", "password": "gjk@2024"},
    {"facility_id": facility_objs[3].id, "name": "Apollo Manager", "email": "admin@apollo.in", "password": "apollo@2024"},
    {"facility_id": facility_objs[4].id, "name": "MedPlus Manager", "email": "admin@medplus.in", "password": "medplus@2024"},
    {"facility_id": facility_objs[5].id, "name": "Care Pharmacy Head", "email": "admin@care.in", "password": "care@2024"},
]
for u in users_data:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if not existing:
        user = User(
            facility_id=u["facility_id"],
            name=u["name"],
            email=u["email"],
            hashed_password=hash_password(u["password"])
        )
        db.add(user)
db.commit()
print(f"  {len(users_data)} users seeded.")

db.close()
print("\n✅ Sample data seeded successfully!")
print("\nLogin credentials:")
for u in users_data:
    print(f"  {u['email']} / {u['password']}")
