/**
 * Full menu transcription from smokymug_scrape.md.
 * Prices are cents. Do not "improve" names, prices, or descriptions here —
 * this file mirrors the source menu images exactly.
 */
import { $, FRI, MON, SAT, SUN, THU, TUE, WED, type SeedCategory } from "./types";

const HH_NOTE = "Happy Hour Wed-Sun 3-6pm: $2 off";
const WINE_HH = "Happy Hour: $8 glass / $32 bottle; Wine Wednesdays HH 'til 9PM";
const FRI_SAT = { type: "days" as const, days: [FRI, SAT], note: "Fri & Sat only" };

export const MENU: SeedCategory[] = [
  /* ================================================================ */
  /* BREAKFAST                                                        */
  /* ================================================================ */
  {
    name: "Breakfast",
    slug: "breakfast",
    description: "Breakfast sandwiches, burritos and cafe fare, made in-house every morning.",
    hoursNote: "Mon–Sat ’til 11:30am · Breakfast Grill Wed–Sat ’til 11:30am · Cafe Fare Wed–Sun ’til 3pm",
    hoursCategory: "breakfast",
    days: [MON, TUE, WED, THU, FRI, SAT],
    end: "11:30",
    sections: [
      {
        name: "Breakfast Grill",
        description: "Avail. til 11:30AM Wed-Sat",
        items: [
          {
            name: "Breakfast Burrito",
            price: $(6.95),
            description: "egg + potatoes + cheddar + hatch green chiles + salsa roja in house flour tortilla",
            modifierGroups: ["breakfast_grill_addons"],
            featured: true,
            availability: { type: "days", days: [WED, THU, FRI, SAT], end: "11:30", note: "Wed–Sat ’til 11:30am" },
          },
          {
            name: "Breakfast Sandwich",
            price: $(7.75),
            description: "egg + american + hatch green chiles on choice bread",
            dietary: ["gluten-free-option"],
            modifierGroups: ["bread_choice", "breakfast_grill_addons"],
            image: "/images/breakfast-sandwich-chorizo.jpg",
            imageAlt: "Egg & Cheese Bagel Breakfast Sandwich with Chorizo",
            featured: true,
            availability: { type: "days", days: [WED, THU, FRI, SAT], end: "11:30", note: "Wed–Sat ’til 11:30am" },
          },
          {
            name: "Breakfast Bowl",
            price: $(7.25),
            description: "egg + potatoes + cheddar + hatch green chiles + salsa roja in bowl",
            modifierGroups: ["breakfast_grill_addons"],
            availability: { type: "days", days: [WED, THU, FRI, SAT], end: "11:30", note: "Wed–Sat ’til 11:30am" },
          },
          {
            name: "Egg & Cheese Taco",
            price: $(4.25),
            description: "egg + cheddar in house flour tortilla",
            dietary: ["gluten-free-option"],
            modifierGroups: ["breakfast_grill_addons"],
            availability: { type: "days", days: [WED, THU, FRI, SAT], end: "11:30", note: "Wed–Sat ’til 11:30am" },
          },
          {
            name: "Bean Burrito",
            price: $(5.45),
            description: "refried beans + potatoes + cheddar in house flour tortilla",
            modifierGroups: ["breakfast_grill_addons"],
            availability: { type: "days", days: [WED, THU, FRI, SAT], end: "11:30", note: "Wed–Sat ’til 11:30am" },
          },
        ],
      },
      {
        name: "Breakfast Grill Add-ons",
        slug: "breakfast-grill-add-ons",
        description: "Add to any grill item",
        type: "addons",
        linkedGroup: "breakfast_grill_addons",
      },
      {
        name: "Cafe Fare",
        description: "Wed–Sun ’til 3pm",
        items: [
          {
            name: "Avocado Bagel / Toast",
            price: $(9.25),
            description: "mashed avocado + pickled red onions + crushed red pepper on everything bagel or toast",
            dietary: ["gluten-free-option", "vegan-option"],
            modifierGroups: ["avocado_base"],
            image: "/images/avocado-toast.jpg",
            imageAlt: "Breakfast Avocado Toast, Casual Cafe Food",
            availability: { type: "days", days: [WED, THU, FRI, SAT, SUN], end: "15:00", note: "Wed–Sun ’til 3pm" },
          },
          {
            name: "Milk & Honey",
            price: $(4.95),
            description: "housemade biscuit + jam + honey",
            availability: { type: "days", days: [WED, THU, FRI, SAT, SUN], end: "15:00", note: "Wed–Sun ’til 3pm" },
          },
          {
            name: "Overnight Oats",
            price: $(5.9),
            description: "oats + chia seeds soaked overnight. various inclusions & flavors",
            dietary: ["gluten-free-option", "vegan-option"],
            availability: { type: "days", days: [WED, THU, FRI, SAT, SUN], end: "15:00", note: "Wed–Sun ’til 3pm" },
          },
          {
            name: "Pastry",
            price: null,
            priceNote: "Varies",
            description: "fresh, housemade baked goods",
            availability: { type: "days", days: [WED, THU, FRI, SAT, SUN], end: "15:00", note: "Wed–Sun ’til 3pm" },
          },
        ],
      },
      {
        name: "Breads",
        items: [
          { name: "Everything Bagel", price: $(3), dietary: ["vegan"], modifierGroups: ["spreads"] },
          { name: "Housemade Biscuit", price: $(3), modifierGroups: ["spreads"] },
          { name: "Texas Toast", price: $(3), modifierGroups: ["spreads"] },
          { name: "Potato Bun", price: $(3), modifierGroups: ["spreads"] },
        ],
      },
      {
        name: "Spreads",
        type: "addons",
        linkedGroup: "spreads",
      },
      {
        name: "Kids'",
        slug: "kids",
        items: [
          {
            name: "Avocado Bun",
            price: $(5),
            description: "mashed avocado on potato bun",
            dietary: ["gluten-free-option"],
          },
          { name: "PB&J", slug: "pb-and-j", price: $(4), description: "peanut butter and house jam on toast" },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* CRAFT BARBECUE                                                   */
  /* ================================================================ */
  {
    name: "Craft Barbecue",
    slug: "craft-barbecue",
    description: "Texas craft barbecue smoked on site, plated through a rotating Tex-Mex menu. Early sellout possible.",
    hoursNote: "Wed–Sat 11:30am–9pm",
    hoursCategory: "bbq",
    days: [TUE, WED, THU, FRI, SAT],
    start: "11:30",
    end: "21:00",
    sections: [
      {
        name: "Cowboy Plates",
        description: "with 2 sides + tortilla + sauce + pickles",
        items: [
          {
            name: "1 Meat Plate",
            slug: "one-meat-plate",
            price: $(17),
            description: "with 2 sides + tortilla + sauce + pickles",
            notes: "Add a side +$4 · Brisket +$2",
            modifierGroups: ["cowboy_meat_1", "cowboy_addons"],
            image: "/images/bbq-platter-mac.jpg",
            imageAlt: "Best Texas Craft BBQ Platter in Richmond! Smoked Meats, Homemade Mac n Cheese",
            featured: true,
          },
          {
            name: "2 Meat Plate",
            slug: "two-meat-plate",
            price: $(25),
            description: "with 2 sides + tortilla + sauce + pickles",
            notes: "Add a side +$4 · Brisket +$2",
            modifierGroups: ["cowboy_meat_2", "cowboy_addons"],
            image: "/images/bbq-platter-full.jpg",
            imageAlt: "Texas Craft Barbecue Platter with Smoked Meats and Homemade Sides",
          },
        ],
      },
      {
        name: "Sandwiches",
        items: [
          {
            name: "Brisket Sandwich",
            price: $(16),
            dietary: ["gluten-free-option"],
            notes: "Base sandwich $14 + $2 brisket upcharge",
            modifierGroups: ["top_it_sandwich"],
            featured: true,
          },
          { name: "Pulled Pork Sandwich", price: $(14), dietary: ["gluten-free-option"], modifierGroups: ["top_it_sandwich"] },
          { name: "Smoked Turkey Sandwich", price: $(14), dietary: ["gluten-free-option"], modifierGroups: ["top_it_sandwich"] },
          {
            name: "Sausage Sandwich",
            price: $(14),
            dietary: ["gluten-free-option"],
            modifierGroups: ["top_it_sandwich"],
            image: "/images/sausage-hatch-fontina.jpg",
            imageAlt: "Homemade Smoked BBQ Sausage, Hatch Green Chile & Fontina Cheese",
          },
          { name: "Smoked Chicken Salad Sandwich", price: $(14), dietary: ["gluten-free-option"], modifierGroups: ["top_it_sandwich"] },
        ],
      },
      {
        name: "Sides",
        description: "Small / Large",
        items: [
          {
            name: "Hatch Chile Mac n Cheese",
            price: $(6.5),
            large: $(11),
            dietary: ["vegetarian"],
            notes: "+$1 over base side price (SM $5.50 / LG $10)",
            featured: true,
          },
          { name: "Collard Greens (w. rib tips)", slug: "collard-greens", price: $(5.5), large: $(10), dietary: ["gluten-free-option"] },
          { name: "Mostaza Potato Salad", price: $(5.5), large: $(10), dietary: ["vegetarian"] },
          { name: "Refried Beans", slug: "refried-beans-side", price: $(5.5), large: $(10), dietary: ["vegan"] },
          { name: "Tejano Slaw", price: $(5.5), large: $(10), dietary: ["gluten-free-option", "vegetarian"] },
          { name: "Fried Potatoes", price: $(5.5), large: $(10), dietary: ["vegetarian"] },
        ],
      },
      {
        name: "Burgers & Wings",
        slug: "burgers-and-wings",
        items: [
          {
            name: "Smokehouse Cheeseburger",
            price: $(16),
            description:
              "thicc 1/2 lb patty + american cheese + hatch green chile aioli + pickles + LTO on toasted potato bun. french fries",
            dietary: ["gluten-free-option"],
            availability: { type: "days", days: [WED, THU, FRI], note: "Wed–Fri only" },
          },
          {
            name: "Chicken Wings",
            price: $(11),
            description: "smoked + fried + sauced. ranch or bleu cheese. 6 pcs",
            notes: "Vegan option: sub fried tofu",
            dietary: ["vegan-option"],
            modifierGroups: ["wings_dip", "wings_vegan"],
          },
        ],
      },
      {
        name: "Nacho Platters",
        items: [
          {
            name: "Nacho Platter",
            price: $(21),
            description: "queso + tejano slaw + verde + crema + jack cheese + guac + onion-cilantro",
            dietary: ["gluten-free-option", "vegetarian-option"],
            notes: "Chicken · Pulled Pork · Bean $21 · Chorizo $24 · Brisket $27",
            modifierGroups: ["nacho_protein"],
          },
        ],
      },
      {
        name: "Tacos",
        items: [
          {
            name: "1 Taco",
            slug: "one-taco",
            price: $(4.25),
            dietary: ["gluten-free-option", "vegetarian-option"],
            notes: "Fillings: carnitas, chorizo, chicken, taco de papas, tofu, pork belly (+$1 per, Fri & Sat only)",
            modifierGroups: ["taco_filling_1", "top_it_taco"],
          },
          {
            name: "3 Tacos",
            slug: "three-tacos",
            price: $(11),
            dietary: ["gluten-free-option", "vegetarian-option"],
            notes: "Fillings: carnitas, chorizo, chicken, taco de papas, tofu, pork belly (+$1 per, Fri & Sat only)",
            modifierGroups: ["taco_filling_3", "top_it_taco"],
            featured: true,
          },
          {
            name: "Brisket Taco",
            price: $(12),
            description: "beans + salsa verde + salsa roja + onion-cilantro",
            image: "/images/brisket-taco.jpg",
            imageAlt: "Tex Mex Brisket Taco on Fresh Homemade Tortilla",
            featured: true,
          },
        ],
      },
      {
        name: "Family Platters",
        items: [
          {
            name: "Small Family Platter",
            price: $(68),
            description: "1/2 lb brisket, 1 lb pulled pork, 1 sausage, 2 lg sides, 4 tortillas, pickles",
            image: "/images/bbq-platter-full.jpg",
            imageAlt: "Texas Craft Barbecue Platter with Smoked Meats and Homemade Sides",
          },
          {
            name: "Large Family Platter",
            price: $(115),
            description: "1 lb brisket, 2 lb pulled pork, 2 sausages, 3 lg sides, 8 tortillas, pickles",
            image: "/images/bbq-platter-mac.jpg",
            imageAlt: "Best Texas Craft BBQ Platter in Richmond! Smoked Meats, Homemade Mac n Cheese",
          },
        ],
      },
      {
        name: "Chips y Mas",
        slug: "chips-y-mas",
        items: [
          {
            name: "Flight",
            price: $(11),
            description: "chips + choice of 3 dips",
            dietary: ["gluten-free-option"],
            modifierGroups: ["flight_dips"],
          },
          { name: "Chips", price: $(2), dietary: ["gluten-free-option", "vegan"] },
          { name: "Queso", price: $(6), dietary: ["gluten-free-option"] },
          { name: "Guacamole", price: $(6), dietary: ["gluten-free-option", "vegan"] },
          { name: "Refried Beans", slug: "refried-beans-dip", price: $(5), dietary: ["gluten-free-option", "vegan"] },
          { name: "Salsa Roja", price: $(5), dietary: ["gluten-free-option", "vegan"] },
        ],
      },
      {
        name: "Meat Market",
        description: "a la carte",
        items: [
          {
            name: "Brisket - 1/2 lb",
            slug: "brisket-half-lb",
            price: $(17),
            image: "/images/brisket-sliced.jpg",
            imageAlt: "Best Texas Craft BBQ Smoked Brisket in Richmond!",
            featured: true,
          },
          { name: "Smoked Turkey - 1/2 lb", slug: "smoked-turkey-half-lb", price: $(13) },
          { name: "Pulled Pork - 1/2 lb", slug: "pulled-pork-half-lb", price: $(11) },
          {
            name: "Sausage - link",
            slug: "sausage-link",
            price: $(7),
            image: "/images/chorizo-sausage.jpg",
            imageAlt: "Homemade Smoked Sausage, Chorizo",
          },
          { name: "Smoked Chicken Salad - 1/2 pint", slug: "smoked-chicken-salad-half-pint", price: $(12) },
          { name: "Pork Belly Burnt Ends - 1/2 lb", slug: "pork-belly-burnt-ends-half-lb", price: $(13), availability: FRI_SAT },
          {
            name: "Spare Ribs - 1/2 lb",
            slug: "spare-ribs-half-lb",
            price: $(11),
            availability: FRI_SAT,
            image: "/images/spare-ribs-sliced.jpg",
            imageAlt: "Texas Craft BBQ Smoked Spare Ribs, Slow Cooked",
            featured: true,
          },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* SUNDAY BRUNCH                                                    */
  /* ================================================================ */
  {
    name: "Sunday Brunch",
    slug: "sunday-brunch",
    description: "Smokehouse brunch every Sunday. Reservations recommended.",
    hoursNote: "Sundays 9:30am–2:30pm",
    hoursCategory: "brunch",
    days: [SUN],
    start: "09:30",
    end: "14:30",
    sections: [
      {
        name: "Entrees",
        items: [
          {
            name: "Brisket Benedict",
            price: $(18),
            description:
              "brisket + over-medium eggs on housemade biscuit, smothered with hatch green chile hollandaise. topped with onion-cilantro relish. side potatoes",
            featured: true,
          },
          {
            name: "P.B.L.T.",
            slug: "pblt",
            price: $(16),
            description: "smoked pork belly + lettuce + tomato + hatch green chile aioli on texas toast. side potatoes",
            dietary: ["gluten-free-option"],
            notes: "Add egg +$3",
            modifierGroups: ["brunch_add_egg"],
          },
          {
            name: "Biscuits 'n Hatch Gravy",
            slug: "biscuits-n-hatch-gravy",
            price: $(12),
            description: "split biscuit smothered in hatch green chile, sausage breakfast gravy",
            notes: "Add egg +$3",
            modifierGroups: ["brunch_add_egg"],
          },
          {
            name: "Pitmaster's Taco",
            slug: "pitmasters-taco",
            price: $(15),
            description:
              "brisket + bacon + potatoes + refried beans + over-medium egg + salsa roja + onion-cilantro relish on house flour tortilla",
          },
          {
            name: "Breakfast Burrito",
            slug: "brunch-breakfast-burrito",
            price: $(6.95),
            description: "egg + potatoes + cheddar + hatch green chiles + salsa roja in house flour tortilla",
            dietary: ["gluten-free-option", "vegetarian"],
            notes: "Add-ins and toppings available",
            modifierGroups: ["burrito_addins", "burrito_addons"],
          },
          {
            name: "Chicken & Churros",
            slug: "chicken-and-churros",
            price: $(17),
            description: "hot chicken thigh, smoked and fried + churros + syrup. side potatoes",
          },
          {
            name: "Huevos Rancheros",
            price: $(15),
            description:
              "carnitas + beans + over-medium eggs on tostada, covered in ranchero sauce + cheese + onion-cilantro relish. side potatoes",
            dietary: ["gluten-free-option", "vegan-option"],
          },
          {
            name: "Breakfast Nachos",
            price: $(15),
            description: "tortilla chips + scramble + queso + verde + potatoes + crema + jack + guac",
            dietary: ["gluten-free-option", "vegetarian"],
            notes: "Add-ons available",
            modifierGroups: ["breakfast_nacho_addons"],
          },
          {
            name: "Southwest Pancakes",
            price: $(12),
            description: "3-pancake stack. side potatoes. Choose savory (chile-bacon jam) or sweet (cactus honey 'n berry)",
            dietary: ["vegetarian"],
            notes: "Add-ons available",
            modifierGroups: ["pancake_style", "pancake_addons"],
          },
          {
            name: "Smokehouse Cheeseburger",
            slug: "brunch-smokehouse-cheeseburger",
            price: $(17),
            description:
              "thicc 1/2 lb patty + american cheese + hatch green chile aioli + pickles + LTO on toasted potato bun. french fries",
            dietary: ["gluten-free-option"],
            notes: "Add egg +$3",
            modifierGroups: ["brunch_add_egg"],
          },
        ],
      },
      {
        name: "Brunch Bar",
        items: [
          { name: "Mimosa", price: $(8), description: "cava + oj" },
          { name: "Bloody", price: $(8), description: "vodka / tequila + bloody mix", modifierGroups: ["bloody_spirit"] },
          { name: "Screwdriver", price: $(8), description: "vodka + oj" },
          { name: "Paloma", price: $(12), description: "tequila + lime + grapefruit + sparkling" },
          { name: "Mexican Coffee", price: $(12), description: "tequila + coffee + chile powder + chocolate + cream" },
          { name: "Guacin' on Sunshine", slug: "guacin-on-sunshine", price: $(12), description: "avocado cilantro margarita slushie" },
          { name: "Pitchers (mimosa | bloody)", slug: "pitchers", price: $(28), modifierGroups: ["pitcher_style"] },
        ],
      },
      {
        name: "Brunch Sides",
        items: [
          { name: "Bacon (3)", slug: "bacon-3", price: $(4) },
          { name: "Biscuit", slug: "brunch-biscuit", price: $(4), dietary: ["vegetarian"] },
          { name: "Pancake", price: $(4), dietary: ["vegetarian"] },
          { name: "Chips & Queso", slug: "chips-and-queso", price: $(8), dietary: ["vegetarian"] },
          { name: "Churros", price: $(5), dietary: ["vegetarian"] },
          { name: "Potatoes", price: $(5), dietary: ["vegetarian"] },
          { name: "French Fries", price: $(5), dietary: ["vegetarian"] },
          { name: "Refried Beans", slug: "brunch-refried-beans", price: $(5), dietary: ["vegan"] },
          { name: "Egg", price: $(3) },
          { name: "Tortilla", price: $(2) },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* BAR & HAPPY HOUR                                                 */
  /* ================================================================ */
  {
    name: "Bar & Happy Hour",
    slug: "bar",
    description: "Drafts, cans, house cocktails and a tight wine list.",
    hoursNote: "Happy Hour Wed–Sun 3–6pm ($2 off drafts & house cocktails; wine $8 glass / $32 bottle; Wine Wednesdays ’til 9pm)",
    hoursCategory: "store",
    sections: [
      {
        name: "Drafts",
        items: [
          { name: "Tiny Esses", price: $(11), description: "Sour Ale", happyHour: HH_NOTE },
          { name: "Kung Fu Kittens", price: $(9), description: "Juicy/Hazy IPA", happyHour: HH_NOTE },
          { name: "Swells", price: $(9), description: "West Coast IPA", happyHour: HH_NOTE },
          { name: "Pacifico", price: $(7), description: "Mexican Lager", happyHour: HH_NOTE },
          { name: "Can't Get Knafeh It", slug: "cant-get-knafeh-it", price: $(12), description: "Pastry Stout", happyHour: HH_NOTE },
          { name: "Coors Light", price: $(5), description: "Light American Lager", happyHour: HH_NOTE },
          { name: "Pylon", price: $(8), description: "Pilsner", happyHour: HH_NOTE },
          { name: "Rotating Tap", price: $(10), description: "Hazy IPA", happyHour: HH_NOTE },
        ],
      },
      {
        name: "Cans",
        items: [
          { name: "Topo Hard Seltzer", price: $(7) },
          { name: "Gunner's Daughter Milk Stout", slug: "gunners-daughter-milk-stout", price: $(11) },
          { name: "Coors Banquet", price: $(5), notes: "+ Bourbon shot +$3", modifierGroups: ["coors_bourbon"] },
          { name: "Tecate", price: $(4), notes: "+ Tequila shot +$3", modifierGroups: ["tecate_tequila"] },
          { name: "Sun Shifter IPA", price: $(7), description: "non-alcoholic", dietary: ["non-alcoholic"], notes: "N.A." },
          { name: "Day Ripper Pils", price: $(7), description: "non-alcoholic", dietary: ["non-alcoholic"], notes: "N.A." },
        ],
      },
      {
        name: "House Cocktails – Old Fashioneds",
        slug: "old-fashioneds",
        items: [
          {
            name: "Esmerelda Old Fashioned",
            price: $(14),
            description: "Wild Turkey 101 + Espresso Syrup + Orange Bitters",
            happyHour: HH_NOTE,
            featured: true,
          },
          {
            name: "Oaxacan Old Fashioned",
            price: $(14),
            description: "Espolon Reposado + Banhez Mezcal + Agave + Orange + Mole Bitters",
            happyHour: HH_NOTE,
          },
        ],
      },
      {
        name: "House Cocktails",
        items: [
          { name: "Guava Nice Day", price: $(13), description: "Banhez Mezcal + Guava + Lavender + Lime + Black Salt", happyHour: HH_NOTE },
          { name: "Ranch Water", price: $(9), description: "Rio J Tequila + Lime + Orange Bitters + Soda", happyHour: HH_NOTE },
          { name: "Mug Mule", price: $(11), description: "Rio J Tequila + Lime + Strawberry + Ginger Beer", happyHour: HH_NOTE },
          { name: "Espresso 'Tini", slug: "espresso-tini", price: $(13), description: "Cirrus Vodka + Espresso + Kahlua + Agave + Mole Bitters", happyHour: HH_NOTE },
          {
            name: "Seasonal Cocktails",
            price: null,
            priceNote: "Ask",
            description: "Ask about seasonal cocktails",
            notes: "Rotating",
            availability: { type: "seasonal", note: "Rotating" },
          },
        ],
      },
      {
        name: "Stay on Yer Horse (N.A.)",
        slug: "stay-on-yer-horse",
        description: "Non-alcoholic",
        items: [
          { name: "Desert Bloom", price: $(8), description: "Blueberry Lavender Kombucha + Ginger + Lemon", dietary: ["non-alcoholic"] },
          { name: "Cactus Cooler", price: $(8), description: "Kefir + Hibiscus + Lime + Mexican Sparkling + Smoked Salt", dietary: ["non-alcoholic"] },
        ],
      },
      {
        name: "Wine",
        description: "Glass / Bottle",
        items: [
          { name: "House Red - Vegas Altas Tempranillo (Spain)", slug: "house-red-tempranillo", price: $(9), bottle: $(30), description: "Tasting notes: Fresh - Juicy - Smooth", happyHour: WINE_HH },
          { name: "House White - Chateau du Claouset Bordeaux Blanc (France)", slug: "house-white-bordeaux-blanc", price: $(9), bottle: $(30), description: "Tasting notes: Crisp - Citrus - Mineral", happyHour: WINE_HH },
          { name: "Red - Cirelli Montepulciano D'abruzzo (Italy)", slug: "red-cirelli-montepulciano", price: $(13), bottle: $(42), description: "Tasting notes: Traditional - Full - Smooth", happyHour: WINE_HH },
          { name: "Glou-Glou - Domaine Benjamin Taillandier Viti Vini Bibi (France)", slug: "glou-glou-viti-vini-bibi", price: $(10), bottle: $(36), description: "Tasting notes: Bright - Juicy - Spiced", happyHour: WINE_HH },
          { name: "Rose - Domaine des Cognettes Rose (France)", slug: "rose-domaine-des-cognettes", price: $(11), bottle: $(39), description: "Tasting notes: Crisp - Fresh - Crushable", happyHour: WINE_HH },
          { name: "White - Domaine des Cognettes Sauvignon Blanc (France)", slug: "white-domaine-des-cognettes-sauvignon-blanc", price: $(11), bottle: $(39), description: "Tasting notes: Fragrant - Zesty - Refreshing", happyHour: WINE_HH },
          { name: "Bubbly - Oriol Rossell Cava Brut Nature (Spain)", slug: "bubbly-oriol-rossell-cava", price: $(10), bottle: $(36), description: "Tasting notes: Dry - Lemon - Mineral", happyHour: WINE_HH },
          { name: "Bubbly Red - Folicello Lambrusco (Italy)", slug: "bubbly-red-folicello-lambrusco", price: $(11), bottle: $(39), description: "Tasting notes: Fizzy - Fun - Fresh", happyHour: WINE_HH },
          { name: "Kalimotxo", price: $(9), description: "red wine + cola", notes: "Tasting notes: Ernest Hemingway - but - fun" },
        ],
      },
    ],
  },

  /* ================================================================ */
  /* CAFE + DRINKS                                                    */
  /* ================================================================ */
  {
    name: "Cafe + Drinks",
    slug: "cafe",
    description: "Specialty espresso drinks, cold brew, teas and sodas, served every day.",
    hoursNote: "’til 7pm (or close, if earlier)",
    hoursCategory: "cafe_drinks",
    end: "19:00",
    sections: [
      {
        name: "Hot",
        description: "Small / Large",
        items: [
          { name: "Drip Coffee", price: $(2.4), large: $(3.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Hot Tea", price: $(2.5), large: $(4), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Au Lait", price: $(2.75), large: $(4.25), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Americano", slug: "hot-americano", price: $(3.75), large: $(6.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Black Eye", price: $(4.75), large: $(5.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          {
            name: "Latte",
            slug: "hot-latte",
            price: $(4.25),
            large: $(5.95),
            priceNote: "Small / Large",
            modifierGroups: ["drink_options"],
            image: "/images/latte-art-1.jpg",
            imageAlt: "Cafe Latte Art on Specialty Latte",
            featured: true,
          },
          { name: "Cappuccino", price: $(4.25), large: $(5.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Mocha", slug: "hot-mocha", price: $(4.75), large: $(6.5), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Flat White", price: $(4.25), large: $(5.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Espresso", slug: "hot-espresso", price: $(3.75), large: $(6.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Chai Latte", slug: "hot-chai-latte", price: $(4.25), large: $(5.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Dirty Chai", slug: "hot-dirty-chai", price: $(6.25), large: $(7.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Matcha Latte", slug: "hot-matcha-latte", price: $(4.25), large: $(5.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Hot Cocoa", price: $(3.25), large: $(4.5), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Milk", slug: "hot-milk", price: $(2.5), large: $(3.75), priceNote: "Small / Large" },
        ],
      },
      {
        name: "Cold / Iced",
        slug: "cold-iced",
        description: "Small / Large",
        items: [
          { name: "Coffee/Tea", slug: "iced-coffee-tea", price: $(2.5), large: $(3.85), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Cold Brew", price: $(3.5), large: $(4.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          {
            name: "Seasonal Sweet Cream Cold Brew",
            price: $(4.75),
            large: $(5.95),
            priceNote: "Small / Large",
            modifierGroups: ["drink_options"],
            image: "/images/sweet-cream-cold-brew.jpg",
            imageAlt: "Sweet Cream Cold Brew with Specialty Lavender Sweet Cream",
            featured: true,
            availability: { type: "seasonal", note: "Seasonal" },
          },
          { name: "Latte", slug: "iced-latte", price: $(4.35), large: $(6), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Mocha", slug: "iced-mocha", price: $(4.85), large: $(6.55), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Americano", slug: "iced-americano", price: $(3.85), large: $(6.85), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Espresso", slug: "iced-espresso", price: $(3.75), large: $(6.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Chai Latte", slug: "iced-chai-latte", price: $(4.35), large: $(6.05), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Dirty Chai", slug: "iced-dirty-chai", price: $(6.35), large: $(8.05), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Matcha Latte", slug: "iced-matcha-latte", price: $(4.35), large: $(6.05), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Milk", slug: "iced-milk", price: $(2.6), large: $(3.85), priceNote: "Small / Large", notes: "+$1 chocolate", modifierGroups: ["milk_chocolate"] },
          {
            name: "Topo Soda",
            price: $(4.75),
            priceNote: "Large only",
            image: "/images/topo-chico-drink.jpg",
            imageAlt: "Flavored Topo Chico Specialty Cafe Drink",
          },
        ],
      },
      {
        name: "Other",
        items: [
          { name: "Fountain Soda", price: $(2.5) },
          { name: "Mexi-Coke", price: $(4.25) },
          { name: "Topo Chico", price: $(4.25) },
          { name: "Kombucha", price: $(5.95) },
          { name: "Juice Bottle", price: $(3.95) },
        ],
      },
      {
        name: "Options",
        type: "addons",
        linkedGroup: "drink_options",
      },
    ],
  },
];
