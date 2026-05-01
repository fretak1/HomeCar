import { PrismaClient, AssetType, ListingType, PropertyStatus, Role } from '@prisma/client';
const prisma = new PrismaClient();

const MARKET_DATA: any = {
  "Addis Ababa": {
    city: "Addis Ababa",
    lat: 9.033, lng: 38.750,
    subcities: ["Addis Ketema", "Akaky Kaliti", "Arada", "Bole", "Kirkos", "Kolfe Keranio", "Lideta", "Nifas Silk-Lafto", "Yeka", "Lemi Kura", "Gullele"],
    villages: {
      "Addis Ketema": ["Merkato", "Geja Sefer", "Wingate", "Autobus Tera"],
      "Akaky Kaliti": ["Saris", "Kaliti", "Tulu Dimtu", "Hana Mariam"],
      "Arada": ["Piassa", "Arat Kilo", "Sidist Kilo", "Jan Meda"],
      "Bole": ["Bole Medhanialem", "Atlas", "CMC", "Ayat", "Gerji", "Summit"],
      "Kirkos": ["Kazanchis", "Gotera", "Meskel Flower", "Mexico Area"],
      "Kolfe Keranio": ["Ayer Tena", "Bethel", "Jemo 1", "Zenebe Werk"],
      "Lideta": ["Abnet", "Torhailoch", "Sengatera", "Balcha"],
      "Nifas Silk-Lafto": ["Jemo", "Lafto", "Lebu", "Mekanisa"],
      "Yeka": ["Kotebe", "Megenagna", "Signal", "Yeka Abado"],
      "Lemi Kura": ["Ayat Real Estate", "Goro Sefer", "Meri", "Arabsa"],
      "Gullele": ["Shiro Meda", "Wingate", "Addisu Gebeya", "Entoto"]
    },
    homes: {
      "compound": { sale: [18e6, 140e6], rent: [60000, 250000] },
      "apartment": { sale: [3e6, 18e6], rent: [15000, 75000] },
      "condominium": { sale: [2.5e6, 8e6], rent: [12000, 35000] },
      "villa": { sale: [40e6, 200e6], rent: [80000, 450000] },
      "studio": { sale: [1.8e6, 4.5e6], rent: [10000, 25000] },
      "building": { sale: [120e6, 800e6], rent: [300000, 2e6] }
    },
    cars: {
      "Toyota Corolla": { price: [1.5e6, 4e6] },
      "Toyota Hilux": { price: [4.5e6, 12e6] },
      "Hyundai Tucson": { price: [2.5e6, 7e6] },
      "Suzuki Alto": { price: [900000, 2.2e6] }
    }
  },
  "Oromia": {
    city: "Adama",
    lat: 8.541, lng: 39.269,
    subcities: ["Bole", "Dabe", "Dembi", "Lugama"],
    villages: {
      "Bole": ["Bole 1", "Bole 2", "Kebele 01"],
      "Dabe": ["Boku", "Migira", "Melka Adama"],
      "Dembi": ["Dembi Centre", "Adama University Area"],
      "Lugama": ["Lugama 1", "Biftu"]
    },
    homes: {
      "compound": { sale: [11e6, 65e6], rent: [32000, 125000] },
      "villa": { sale: [16e6, 75e6], rent: [32000, 125000] }
    },
    cars: {
      "Toyota Hilux": { price: [3.8e6, 8.5e6] }
    }
  },
  "Amhara": {
    city: "Bahir Dar",
    lat: 11.590, lng: 37.390,
    subcities: ["Fasilo", "Belay Zeleke", "Gish Abay", "Sefene Selam"],
    villages: {
      "Fasilo": ["Kebele 1", "Kebele 14", "Fasilo Stadium Area"],
      "Belay Zeleke": ["Kebele 3", "Diaspora Area", "Kebele 15"],
      "Gish Abay": ["Kebele 5", "Lakeside", "Kebele 16"],
      "Sefene Selam": ["Kebele 7", "Sefene 1"]
    },
    homes: {
      "compound": { sale: [12e6, 85e6], rent: [35000, 140000] },
      "apartment": { sale: [2.8e6, 12e6], rent: [12000, 45000] },
      "villa": { sale: [22e6, 95e6], rent: [42000, 160000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.3e6, 3.8e6] }
    }
  },
  "Tigray": {
    city: "Mekelle",
    lat: 13.496, lng: 39.476,
    subcities: ["Ayder", "Hawelti", "Kedamay Weyane", "Quiha", "Hadnet"],
    villages: {
      "Ayder": ["Ayder 1", "Ayder Hospital Area"],
      "Hawelti": ["Hawelti Center", "Kebele 15"],
      "Kedamay Weyane": ["Romanat", "Kedamay 2"],
      "Quiha": ["Quiha Center", "Airport Road"],
      "Hadnet": ["Hadnet 1", "Adi Haki"]
    },
    homes: {
      "compound": { sale: [10e6, 50e6], rent: [30000, 100000] },
      "villa": { sale: [15e6, 60e6], rent: [35000, 120000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.2e6, 3.2e6] }
    }
  },
  "Sidama": {
    city: "Hawassa",
    lat: 7.062, lng: 38.473,
    subcities: ["Tabore", "Hayik Dar", "Menahariya", "Mehal Ketema"],
    villages: {
      "Tabore": ["Tabor 1", "Piazza", "Tabor 2"],
      "Hayik Dar": ["Amora Gedel", "Gudumale", "Lakeside 2"],
      "Menahariya": ["Bus Station Area", "Atote", "Mobil"],
      "Mehal Ketema": ["Awasho", "Bolesh"]
    },
    homes: {
      "compound": { sale: [11e6, 75e6], rent: [35000, 120000] },
      "apartment": { sale: [2.5e6, 10e6], rent: [10000, 35000] },
      "villa": { sale: [18e6, 85e6], rent: [35000, 120000] }
    },
    cars: {
      "Toyota Land Cruiser": { price: [7e6, 22e6] }
    }
  },
  "Dire Dawa": {
    city: "Dire Dawa",
    lat: 9.593, lng: 41.866,
    subcities: ["Megala", "Aboker", "Gende Kore", "Depot"],
    villages: {
      "Megala": ["Megala 1", "Ashewa Meda", "Chat Tera"],
      "Aboker": ["Taiwan", "Legehare", "Aboker 2"],
      "Gende Kore": ["Sabian", "Gende Kore 2"],
      "Depot": ["Railway Area", "Depot 2"]
    },
    homes: {
      "villa": { sale: [15e6, 60e6], rent: [28000, 110000] }
    },
    cars: {
      "Toyota Corolla": { price: [1.2e6, 3.5e6] }
    }
  }
};

const CAR_TEMPLATES = [
  { brand: "Toyota", models: ["Corolla", "Hilux", "Land Cruiser", "Vitz"], fuel: "Petrol" },
  { brand: "Toyota", models: ["Prius"], fuel: "Hybrid" },
  { brand: "Toyota", models: ["bZ4X"], fuel: "Electric" },
  { brand: "Hyundai", models: ["Tucson", "Elantra", "Accent"], fuel: "Petrol" },
  { brand: "Kia", models: ["Sportage"], fuel: "Petrol" },
  { brand: "Nissan", models: ["Patrol", "Sunny"], fuel: "Diesel" },
  { brand: "Suzuki", models: ["Alto"], fuel: "Petrol" },
  { brand: "BYD", models: ["Song Plus", "Seagull", "Han"], fuel: "Electric" },
  { brand: "Volkswagen", models: ["ID.4", "ID.6"], fuel: "Electric" }
];

const AMENITIES_HOME = ["Swimming Pool", "Garden", "Garage", "Elevator", "G+2", "Fully Furnished", "High Security", "Backup Generator"];
const AMENITIES_CAR = ["Sunroof", "Multimedia Screen", "Leather Seats", "Alloy Rims", "Rear Camera", "ABS", "Airbags", "Keyless Entry"];

const HOUSE_IMAGES = [
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=800",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800"
];

const CAR_IMAGES = [
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=800"
];

function getRandom(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFrom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("--- Resetting Database & Starting Balanced Seeding (1100 Homes / 900 Cars) ---");

  // Helper for retrying DB operations on remote connections
  const withRetry = async <T>(fn: () => Promise<T>, retries = 5): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (retries > 0) {
        console.log(`Connection weak, retrying... (${retries} left)`);
        await new Promise(r => setTimeout(r, 2000));
        return withRetry(fn, retries - 1);
      }
      throw e;
    }
  };

  // Cleanup
  const tables = ['propertyImage', 'propertyView', 'favorite', 'application', 'transaction', 'review', 'maintenanceRequest', 'lease', 'property', 'location'];
  for (const t of tables) {
      await (prisma as any)[t].deleteMany({}).catch(() => {});
      console.log(`Cleared ${t} table.`);
  }
  
  // Ensure Owner
  let owner = await withRetry(() => prisma.user.findFirst({ where: { role: 'OWNER' } }));
  if (!owner) {
    owner = await withRetry(() => prisma.user.create({
      data: { name: "Synthetic Seeder", email: "seeder@homecar.et", role: Role.OWNER, verified: true }
    }));
  }

  const calculateHousePrice = (type: string, area: number, beds: number, baths: number, city: string, isRent: boolean) => {
    const HOME_RATE: any = { "Addis Ababa": 45000, "Bahir Dar": 25000, "Hawassa": 24000, "Adama": 20000, "Mekelle": 22000 };
    const rate = HOME_RATE[city] || 15000;
    const typeMult: any = { villa: 1.8, compound: 1.2, apartment: 1.0, condominium: 0.8, studio: 0.7, building: 2.5 };
    let total = (area * rate * (typeMult[type] || 1.0)) + (beds * 1500000) + (baths * 800000);
    return isRent ? Math.floor((total * 0.005) / 1000) * 1000 : Math.floor(total / 10000) * 10000;
  };

  const calculateCarPrice = (brand: string, model: string, year: number, trans: string, fuel: string) => {
    const basePrices: any = { "Toyota Corolla": 3000000, "Toyota Hilux": 8000000, "Hyundai Tucson": 6000000, "Suzuki Alto": 1800000, "BYD Song Plus": 6500000 };
    const base = basePrices[`${brand} ${model}`] || 2500000;
    let finalPrice = base * Math.pow(0.93, Math.max(0, 2025 - year));
    if (trans === "Automatic") finalPrice *= 1.12;
    if (fuel === "Electric") finalPrice *= 1.20;
    return Math.floor(finalPrice / 5000) * 5000;
  };

  // --- 1. PREPARE TASKS (1100 Homes + 900 Cars) ---
  type SeedTask = { type: 'HOME' | 'CAR' };
  const tasks: SeedTask[] = [
    ...Array(1100).fill({ type: 'HOME' }),
    ...Array(900).fill({ type: 'CAR' })
  ];

  // Shuffle tasks to mix Homes and Cars in the chronological feed
  for (let i = tasks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
  }

  console.log(`Starting interleaved seeding of ${tasks.length} properties...`);

  let addisHomesCreated = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    
    // Determine region based on requirements (600 Addis homes, rest random)
    let regionName: string;
    if (task.type === 'HOME') {
        if (addisHomesCreated < 600) {
            regionName = "Addis Ababa";
            addisHomesCreated++;
        } else {
            regionName = getRandomFrom(Object.keys(MARKET_DATA).filter(r => r !== "Addis Ababa"));
        }
    } else {
        regionName = getRandomFrom(Object.keys(MARKET_DATA));
    }

    const regionData = MARKET_DATA[regionName];
    const subcity = getRandomFrom(regionData.subcities);
    const village = getRandomFrom(regionData.villages[subcity]);

    const location = await withRetry(() => prisma.location.create({
      data: { 
          region: regionName, 
          city: regionData.city, 
          subcity, 
          village, 
          lat: regionData.lat + (Math.random() - 0.5) * 0.1, 
          lng: regionData.lng + (Math.random() - 0.5) * 0.1 
      }
    }));

    if (task.type === 'HOME') {
      const pType = getRandomFrom(['apartment', 'villa', 'condo', 'studio', 'penthouse']);
      const isRent = Math.random() > 0.5;
      
      let beds = 0;
      let area = 0;
      if (pType === 'studio') {
          beds = 0;
          area = getRandom(25, 45);
      } else {
          beds = getRandom(1, 6);
          area = beds * 60 + getRandom(20, 100);
      }
      const baths = Math.max(1, beds - 1);
      const finalPrice = calculateHousePrice(pType, area, beds, baths, regionData.city, isRent);

      const property = await withRetry(() => prisma.property.create({
        data: {
          title: `${pType.charAt(0).toUpperCase() + pType.slice(1)} in ${village}`,
          description: `Stunning ${pType} in ${village}. Perfectly sized at ${area}sqm.`,
          assetType: AssetType.HOME,
          listingType: [isRent ? ListingType.RENT : ListingType.BUY],
          price: finalPrice,
          propertyType: pType,
          bedrooms: beds,
          bathrooms: baths,
          area,
          ownerId: owner.id,
          listedById: owner.id,
          locationId: location.id,
          status: PropertyStatus.AVAILABLE,
          isVerified: true,
          amenities: Array.from({ length: 3 }, () => getRandomFrom(AMENITIES_HOME))
        }
      }));

      await withRetry(() => prisma.propertyImage.create({ data: { url: getRandomFrom(HOUSE_IMAGES), isMain: true, propertyId: property.id } }));
    } else {
      const brandData = getRandomFrom(CAR_TEMPLATES);
      const model = getRandomFrom(brandData.models);
      const year = getRandom(2010, 2024);
      const trans = Math.random() > 0.5 ? "Automatic" : "Manual";
      const finalPrice = calculateCarPrice(brandData.brand, model, year, trans, brandData.fuel);

      const property = await withRetry(() => prisma.property.create({
        data: {
          title: `${year} ${brandData.brand} ${model}`,
          description: `Excellent ${brandData.brand} ${model} for sale in ${regionData.city}.`,
          assetType: AssetType.CAR,
          listingType: [ListingType.BUY],
          price: finalPrice,
          brand: brandData.brand,
          model,
          year,
          fuelType: brandData.fuel,
          transmission: trans,
          mileage: getRandom(5000, 150000),
          ownerId: owner.id,
          listedById: owner.id,
          locationId: location.id,
          status: PropertyStatus.AVAILABLE,
          isVerified: true,
          amenities: Array.from({ length: 3 }, () => getRandomFrom(AMENITIES_CAR))
        }
      }));

      await withRetry(() => prisma.propertyImage.create({ data: { url: getRandomFrom(CAR_IMAGES), isMain: true, propertyId: property.id } }));
    }

    if (i % 100 === 0) console.log(`Seeded ${i}/${tasks.length} properties...`);
  }

  console.log("--- Seeding Complete! ---");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
