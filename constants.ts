
import { OwnerData, BreedInfo, Announcement } from './types';

// Updated with 53 Indigenous + 1 Synthetic as per ICAR-NBAGR data
export const CATTLE_BREEDS: string[] = [
    "Amritmahal", "Bachaur", "Bargur", "Dangi", "Deoni", "Gaolao", "Gir", "Hallikar", "Hariana", "Kangayam", "Kankrej", "Kenkatha", "Kherigarh", "Khillar", "Krishna Valley", "Malvi", "Mewati", "Nagori", "Nimari", "Ongole", "Ponwar", "Punganur", "Rathi", "Red Kandhari", "Red Sindhi", "Sahiwal", "Siri", "Tharparkar", "Umblachery", "Vechur", "Motu", "Ghumusari", "Binjharpuri", "Khariar", "Pulikulam", "Kosali", "Malnad Gidda", "Belahi", "Gangatiri", "Badri", "Lakhimi", "Ladakhi", "Konkan Kapila", "Poda Thurpu", "Nari", "Dagri", "Thutho", "Shweta Kapila", "Himachali Pahari", "Purnea", "Kathani", "Sanchori", "Masilum", "Frieswal"
];

// Updated with 20 breeds as per ICAR-NBAGR data
export const BUFFALO_BREEDS: string[] = [
    "Banni", "Bargur", "Bhadawari", "Chhattisgarhi", "Chilika", "Dharwad", "Gojri", "Jaffarabadi", "Kalahandi", "Luit (Swamp)", "Manda", "Marathwadi", "Mehsana", "Murrah", "Nagpuri", "Nili Ravi", "Pandharpuri", "Purnathadi", "Surti", "Toda"
];

export const ALL_BREEDS: BreedInfo[] = [
    // Cattle
    ...CATTLE_BREEDS.map(b => ({ name: b, species: 'Cow' as 'Cow', facts: 'Detailed facts for this breed are being compiled and will be available soon.' })),
    // Buffalo
    ...BUFFALO_BREEDS.map(b => ({ name: b, species: 'Buffalo' as 'Buffalo', facts: 'Detailed facts for this breed are being compiled and will be available soon.' })),
];

// Sample facts for demonstration
const sampleFacts: { [key: string]: string } = {
    "Sahiwal": "The Sahiwal is one of the best dairy breeds of zebu cattle, known for its high milk production and heat tolerance. It originated in the Sahiwal district of Punjab, Pakistan. They are generally docile and lethargic, making them easy to manage. Their milk is known for a high butterfat content.",
    "Gir": "The Gir is a famous dairy cattle breed originating from the Gir hills of South Kathiawar in Gujarat. It is renowned for its milking prowess and tolerance to hot, stressful conditions. A key characteristic is their convex forehead, which acts as a cooling system for the brain and pituitary gland.",
    "Murrah": "Murrah buffalo is a breed of water buffalo mainly found in the Indian states of Haryana and Punjab. It is kept for dairy production. The Murrah is known as the 'black gold' of India and is one of the most efficient milk producers in the world. They have tightly curled horns, a distinct feature of the breed.",
    "Tharparkar": "The Tharparkar is a dual-purpose breed, known for both its milking and draught capabilities. It originates from the Tharparkar District in Sindh province, now in Pakistan, and is also found in Rajasthan, India. They are very hardy and can thrive on poor-quality feed and under harsh environmental conditions."
};

// Add sample facts to the main list
ALL_BREEDS.forEach(breed => {
    if (sampleFacts[breed.name]) {
        breed.facts = sampleFacts[breed.name];
    }
});
ALL_BREEDS.sort((a, b) => a.name.localeCompare(b.name));


export const ANNOUNCEMENTS: Announcement[] = [
    {
        id: "ann1",
        title: "New Subsidy for Gir Cattle Owners",
        content: "The government has announced a new 40% subsidy on feed for registered owners of Gir cattle in Gujarat to boost milk production.",
        linkText: "Learn more",
        tags: ["Gir", "Subsidy", "Gujarat"]
    },
    {
        id: "ann2",
        title: "National Livestock Mission Update",
        content: "The NLM portal has been updated with new guidelines for 2024-25. All field workers are advised to review the changes.",
        linkText: "Read guidelines",
        tags: ["National"]
    },
    {
        id: "ann3",
        title: "FMD Vaccination Drive in Haryana",
        content: "A state-wide Foot-and-Mouth Disease (FMD) vaccination campaign will commence from next month for all cattle and buffaloes.",
        linkText: "View schedule",
        tags: ["Vaccination", "Haryana"]
    }
];


export const SAMPLE_OWNER_DATA: OwnerData = {
    name: "Rajesh Kumar",
    mobile: "9876543210",
    aadhaar: "123456789012",
    dob: "1985-06-15",
    gender: "Male",
    address: "123, Kisan Nagar",
    village: "Ramgarh",
    district: "Hissar",
    state: "Haryana",
};

export const ANALYSIS_MESSAGES: string[] = [
    "Initializing AI-Vet analysis...",
    "Scanning image for key features...",
    "Analyzing coat patterns and coloration...",
    "Comparing facial structure with breed database...",
    "Evaluating horn shape and size...",
    "Checking body conformation and musculature...",
    "Cross-referencing with 70+ indigenous breeds...",
    "Finalizing confidence score...",
    "Compiling genetic trait report...",
    "Almost there, generating care recommendations..."
];