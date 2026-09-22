import type { HoursCategory } from "../schema";
import { FRI, MON, SAT, SUN, THU, TUE, WED } from "./types";

export const RESTAURANT = {
  id: 1,
  name: "The Smoky Mug",
  tagline: "Richmond's Best Texas Craft BBQ + Cafe in Brookland Park!",
  category: "Cafe & Craft Barbecue & Tex-Mex Kitchen",
  description:
    "Cafe & Craft Barbecue & Tex-Mex Kitchen in Northside Richmond, VA. Coffee and elevated cafe fare served every day. Top class brisket, pulled pork, ribs, and more smoked on site and plated through a unique rotating Tex-mex menu.",
  addressLine1: "2930 North Avenue",
  city: "Richmond",
  state: "VA",
  zip: "23222",
  neighborhood: "Brookland Park (Historic Brookland Park Blvd business corridor), Northside Richmond",
  phone: "(804) 562-3722",
  email: "thesmokymug@gmail.com",
  website: "https://www.smokymug.com",
  instagramUrl: "https://www.instagram.com/thesmokymug",
  facebookUrl: "https://www.facebook.com/thesmokymug",
  giftCardUrl: "https://www.toasttab.com/thesmokymug/giftcards",
  giftCardBalanceUrl: "https://www.toasttab.com/thesmokymug/findcard",
  loyaltyUrl: "https://www.toasttab.com/thesmokymug/rewardsSignup",
  marketingSignupUrl: "https://www.toasttab.com/thesmokymug/marketing-signup",
  brunchReservationUrl: "https://host.tablesready.com/p/book/add/thesmokymug",
  logoUrl: "/images/logo.png",
  ogImageUrl: "/images/og-square-logo.png",
  features: [
    "Dog-friendly covered porch",
    "Wi-Fi",
    "Specialty cocktails & bar eats",
    "Vegan, vegetarian and gluten-free options",
    "Homemade tortillas",
    "Meats smoked on site",
    "Taco Tuesday specials",
    "Early sellout possible (call ahead / follow Instagram)",
  ],
  cafeSummary: "Specialty lattes, breakfast sandwiches & burritos, housemade pastries, 7 days a week",
  bbqSummary:
    "Texas craft barbecue Tue-Sun: brisket, ribs, pulled pork; tacos, nachos, sandwiches; rotating Tex-Mex menu",
};

type HoursRow = {
  category: HoursCategory;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed?: boolean;
  note?: string;
};

const days = (list: number[], row: Omit<HoursRow, "dayOfWeek">): HoursRow[] =>
  list.map((dayOfWeek) => ({ dayOfWeek, ...row }));

export const HOURS: HoursRow[] = [
  // Store hours
  { category: "store", dayOfWeek: MON, opensAt: "07:00", closesAt: "12:00" },
  { category: "store", dayOfWeek: TUE, opensAt: "07:00", closesAt: "21:00" },
  { category: "store", dayOfWeek: WED, opensAt: "07:00", closesAt: "21:00" },
  { category: "store", dayOfWeek: THU, opensAt: "07:00", closesAt: "21:00" },
  { category: "store", dayOfWeek: FRI, opensAt: "07:00", closesAt: "22:00" },
  { category: "store", dayOfWeek: SAT, opensAt: "08:00", closesAt: "22:00" },
  { category: "store", dayOfWeek: SUN, opensAt: "09:30", closesAt: "14:30" },

  // Breakfast (opensAt null = from opening)
  { category: "breakfast", dayOfWeek: MON, opensAt: null, closesAt: "12:00" },
  ...days([TUE, WED, THU, FRI, SAT], {
    category: "breakfast",
    opensAt: null,
    closesAt: "11:30",
    note: "Menu image header says 'Mon - Sat til 11:30am'; Breakfast Grill 'Avail. til 11:30AM Wed-Sat'",
  }),

  // Cafe fare
  ...days([WED, THU, FRI, SAT, SUN], {
    category: "cafe_fare",
    opensAt: null,
    closesAt: "15:00",
    note: "Avocado toast, milk & honey, overnight oats, pastry",
  }),

  // Cafe + drinks (daily)
  ...days([SUN, MON, TUE, WED, THU, FRI, SAT], {
    category: "cafe_drinks",
    opensAt: null,
    closesAt: "19:00",
    note: "'til 7pm (or close, if earlier)",
  }),

  // BBQ
  { category: "bbq", dayOfWeek: TUE, opensAt: "11:30", closesAt: "21:00", note: "Taco Tuesday Specials; early sellout possible" },
  ...days([WED, THU, FRI, SAT], {
    category: "bbq",
    opensAt: "11:30",
    closesAt: "21:00",
    note: "Early sellout possible; menu image header says 'Wed - Sat 11:30a - 9p'",
  }),

  // Brunch
  { category: "brunch", dayOfWeek: SUN, opensAt: "09:30", closesAt: "14:30", note: "Reservations via TablesReady" },

  // Happy Hour — website says Wed–Sat; bar menu image says Wed–Sun (store closes 2:30 PM on Sundays)
  ...days([WED, THU, FRI, SAT], {
    category: "happy_hour",
    opensAt: "15:00",
    closesAt: "18:00",
    note: "$2 off drafts & house cocktails; $8 glass / $32 bottle wine. Website says Wed-Sat; Bar menu image says Wed-Sun 3-6PM",
  }),

  // Wine Wednesdays
  { category: "wine_wednesday", dayOfWeek: WED, opensAt: "15:00", closesAt: "21:00", note: "Wine happy hour extended 'til 9PM" },
];

/**
 * Default reservation rules. These are NOT from the scrape (the old site only
 * linked out to TablesReady for brunch); they are derived from store hours and
 * are fully editable in /admin/settings and /admin/hours.
 */
export const BOOKING_SETTINGS = {
  id: 1,
  slotIntervalMinutes: 30,
  turnTimeMinutes: 90,
  minPartySize: 1,
  maxPartySize: 10,
  largePartyThreshold: 7,
  maxBookingsPerSlot: 4,
  maxCoversPerSlot: 24,
  minLeadTimeMinutes: 60,
  maxDaysInAdvance: 60,
  autoConfirm: true,
  bookingsEnabled: true,
  seatingPreferences: ["No preference", "Indoor", "Covered porch (dog-friendly)", "Bar"],
  occasions: ["Birthday", "Anniversary", "Date night", "Business meal", "Celebration", "Just hungry"],
  timezone: "America/New_York",
};

export const BOOKING_WINDOWS = [
  { dayOfWeek: TUE, startTime: "11:30", endTime: "20:00", label: "Lunch & Dinner" },
  { dayOfWeek: WED, startTime: "11:30", endTime: "20:00", label: "Lunch & Dinner" },
  { dayOfWeek: THU, startTime: "11:30", endTime: "20:00", label: "Lunch & Dinner" },
  { dayOfWeek: FRI, startTime: "11:30", endTime: "21:00", label: "Lunch & Dinner" },
  { dayOfWeek: SAT, startTime: "11:30", endTime: "21:00", label: "Lunch & Dinner" },
  { dayOfWeek: SUN, startTime: "09:30", endTime: "13:30", label: "Sunday Brunch" },
];

const CDN = "https://images.squarespace-cdn.com/content/v1/626014401c69f919495f4b3f";

export const GALLERY = [
  { file: "bbq-platter-mac.jpg", alt: "Best Texas Craft BBQ Platter in Richmond! Smoked Meats, Homemade Mac n Cheese", tag: "bbq", width: 828, height: 636, sourceUrl: `${CDN}/510b9df1-b0d7-4d48-91d5-36510bb9e375/IMG_3569.jpg` },
  { file: "sausage-hatch-fontina.jpg", alt: "Homemade Smoked BBQ Sausage, Hatch Green Chile & Fontina Cheese", tag: "bbq", width: 739, height: 1012, sourceUrl: `${CDN}/402c4295-d2c5-4118-b8d0-ba85195aa90f/IMG_3564.jpg` },
  { file: "breakfast-sandwich-chorizo.jpg", alt: "Egg & Cheese Bagel Breakfast Sandwich with Chorizo", tag: "breakfast", width: 668, height: 811, sourceUrl: `${CDN}/f8886feb-bc23-495a-af88-e201ff9e187f/IMG_3555.jpg` },
  { file: "latte-art-1.jpg", alt: "Cafe Latte Art on Specialty Latte", tag: "coffee", width: 732, height: 763, sourceUrl: `${CDN}/ded3b315-803e-42a7-84c9-4e32e7281da8/IMG_3573.jpg` },
  { file: "brisket-taco.jpg", alt: "Tex Mex Brisket Taco on Fresh Homemade Tortilla", tag: "tacos", width: 828, height: 703, sourceUrl: `${CDN}/4bea0d44-437d-4fe8-9da1-dbc8a5ea0380/IMG_3579.jpg` },
  { file: "spare-ribs-rack.jpg", alt: "Smoked Full Rack Pork Spare Ribs, Slow Cooked", tag: "bbq", width: 828, height: 560, sourceUrl: `${CDN}/8fa291ca-0c1e-463e-8aea-a9f1cdc5fb09/IMG_3567.jpg` },
  { file: "vegan-cauliflower.jpg", alt: "Vegan BBQ Fire Roasted Cauliflower Heads", tag: "bbq", width: 668, height: 804, sourceUrl: `${CDN}/ccd95620-13fd-477c-9161-264b22b16ab5/IMG_3558.jpg` },
  { file: "topo-chico-drink.jpg", alt: "Flavored Topo Chico Specialty Cafe Drink", tag: "drinks", width: 679, height: 991, sourceUrl: `${CDN}/21b305e0-d70f-4076-b162-38d7b2864b1e/IMG_3554.jpg` },
  { file: "sausage-prep.jpg", alt: "Preparing Homemade Smoked Sausage", tag: "prep", width: 706, height: 980, sourceUrl: `${CDN}/b7716c39-593d-4178-a988-a48721a55ce3/IMG_3563.jpg` },
  { file: "brisket-sliced.jpg", alt: "Best Texas Craft BBQ Smoked Brisket in Richmond!", tag: "bbq", width: 735, height: 744, sourceUrl: `${CDN}/6cd49fba-3325-43ed-8580-8f93171f3bfa/IMG_3574.jpg` },
  { file: "bbq-platter-full.jpg", alt: "Texas Craft Barbecue Platter with Smoked Meats and Homemade Sides. Slow Cooked Brisket, BBQ Burnt Ends, Smoked Chicken, Juicy Pork Spare Ribs, Pickled Jalapenos", tag: "bbq", width: 687, height: 1062, sourceUrl: `${CDN}/e0653321-9f25-4502-80d2-7dec99ad07b9/IMG_3557.jpg` },
  { file: "beef-ribs.jpg", alt: "Texas Craft BBQ Smoked Beef Ribs, Slow Cooked", tag: "bbq", width: 828, height: 555, sourceUrl: `${CDN}/b6a6a2bf-2f6c-4fe1-ba03-86c512a83488/IMG_3572.jpg` },
  { file: "salsa-verde-prep.jpg", alt: "Tex Mex Homemade Salsa Verde Prep", tag: "prep", width: 599, height: 581, sourceUrl: `${CDN}/e0c1a6c6-c4ed-4f58-81c2-c6980ba9979d/IMG_3561.jpg` },
  { file: "chorizo-sausage.jpg", alt: "Homemade Smoked Sausage, Chorizo", tag: "bbq", width: 581, height: 799, sourceUrl: `${CDN}/86fef451-2d95-4dcc-9125-300f9dc71eea/IMG_3562.jpg` },
  { file: "sweet-cream-cold-brew.jpg", alt: "Sweet Cream Cold Brew with Specialty Lavender Sweet Cream", tag: "coffee", width: 828, height: 812, sourceUrl: `${CDN}/117a8718-518e-4b8b-b05d-539eeb7b6e4b/IMG_3578.jpg` },
  { file: "brisket-smoker.jpg", alt: "Texas Craft BBQ Smoked Brisket, Slow Cooked in Wood-fire Smoker", tag: "bbq", width: 828, height: 798, sourceUrl: `${CDN}/5cc4cc07-6bcd-443a-883b-54960e45b5be/IMG_3576.jpg` },
  { file: "pitmaster-ryan.jpg", alt: "Pitmaster Ryan with BBQ Smoked Meats. Best Authentic Wood-Fired Smokehouse in Richmond", tag: "people", width: 753, height: 801, sourceUrl: `${CDN}/27c6b68f-d1bb-4a95-a401-06c6a40e3433/IMG_3571.jpg` },
  { file: "avocado-toast.jpg", alt: "Breakfast Avocado Toast, Casual Cafe Food", tag: "breakfast", width: 828, height: 814, sourceUrl: `${CDN}/2fcd67e8-62bd-491c-b27d-3ad299db7b35/IMG_3570.jpg` },
  { file: "latte-art-2.jpg", alt: "Cafe Latte Art on Specialty Latte", tag: "coffee", width: 790, height: 780, sourceUrl: `${CDN}/09eb97a9-398f-4352-b026-8c660167a93a/IMG_3568.jpg` },
  { file: "spare-ribs-sliced.jpg", alt: "Texas Craft BBQ Smoked Spare Ribs, Slow Cooked", tag: "bbq", width: 649, height: 425, sourceUrl: `${CDN}/3f9bf798-6ac3-4619-813e-2270c20bce08/IMG_3566.jpg` },
  // Catering page
  { file: "catering-taco-platter.png", alt: "Tex Mex Taco Platter. Homemade Tortillas, Smoked Meats, Homemade Sides, Smoked Turkey, Pulled Pork, Potato Tacos, Chips n Guac, Chips n Salsa, Coleslaw", tag: "catering", width: 696, height: 871, sourceUrl: `${CDN}/1a75afc4-f31e-4aa2-81c3-8252577e34ac/Screenshot+2025-07-18+at+13-45-00+Instagram.png` },
  { file: "catering-brisket-taco-guac.png", alt: "Brisket Taco, Chips n Guac, Guacamole", tag: "catering", width: 764, height: 871, sourceUrl: `${CDN}/7d191f65-cf3e-4062-9572-9dfc310d5ced/Screenshot+2025-07-18+at+13-43-47+Instagram.png` },
  { file: "catering-pork-butt.png", alt: "Herb Smoked Pork Butt. Wood-Fired Smoked BBQ.", tag: "catering", width: 696, height: 871, sourceUrl: `${CDN}/dec6c365-7bb0-495b-ad59-a2a95cfa1814/image+42.png` },
  { file: "catering-full-service.png", alt: "Full Service Catering for Parties and Special Events", tag: "catering", width: 656, height: 821, sourceUrl: `${CDN}/93e906a3-9058-40bd-8802-d1940762833d/Screenshot+2025-07-18+at+13-37-33+Instagram.png` },
];

export const REVIEWS = [
  { reviewerInitials: "S.D.", platform: "Yelp", themes: ["Chorizo breakfast burrito", "Homemade tortillas"], sentiment: "Very positive - 'tops in town' sentiment" },
  { reviewerInitials: "J.H.", platform: "Google", themes: ["Caramel mocha latte", "Brisket", "Mac n cheese sauce"], sentiment: "Very positive - plans to return" },
  { reviewerInitials: "A.W.", platform: "Yelp", themes: ["Lattes (top 5 in Richmond)", "Value", "Service", "Blueberry muffin"], sentiment: "Very positive" },
  { reviewerInitials: "T.H.", platform: "Yelp", themes: ["Food quality", "Casual ambiance", "Knowledgeable staff", "Hatch chile mac and cheese"], sentiment: "Very positive - nothing to improve" },
  { reviewerInitials: "C.P.", platform: "Google", themes: ["Chai latte", "Brisket", "Pulled pork", "Hatch chili mac and cheese", "Atmosphere"], sentiment: "Very positive" },
  { reviewerInitials: "H&A", platform: "Google", themes: ["Burnt ends", "Brisket", "Mac n cheese", "Coffee", "Owner Dan"], sentiment: "Very positive - 'best BBQ in town' sentiment" },
];

export const CATERING = {
  quote: "Time-honored recipes, quality ingredients, and a well seasoned staff (and food) makes every event memorable, big or small",
  note: "Catering menu available upon request. Minimum orders required for full service. Delivery fees apply.",
  serviceTypes: ["Pick-up", "Delivery (fees apply)", "Full service (delivery, setup, line service, cleanup)", "Restaurant rental for events"],
  categories: [
    { name: "Parties", description: "Birthdays, graduations, weddings, anniversaries, showers, retirements, tailgates & more." },
    { name: "Professional", description: "Professional breakfasts and lunches; variety of menu items for attendees." },
    { name: "Holiday", description: "Superbowl wings, Thanksgiving turkeys, Christmas pork butts; pre-order holiday meals." },
    { name: "Full Service", description: "Staffed options including delivery, setup, line service, and cleanup. Minimum orders required." },
  ],
};
