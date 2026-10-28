/**
 * Full menu transcription from the 2026 menu PDF (six pages: Cafe & Drinks,
 * Bar, Sunday Brunch, Craft Barbecue, South Western Breakfast, Tex Mex).
 * Prices are cents. Do not "improve" names, prices, or descriptions here:
 * this file mirrors the printed menu, typos included. Anything the print
 * leaves ambiguous is marked `// TODO 2026-menu:` for the owner to confirm.
 *
 * Dietary marks: gfo → gluten-free-option, vg → vegan-option,
 * v → vegetarian-option (the 2026 legend calls all three "option").
 * Items with no printed mark keep the tags they had in the previous seed.
 */
import { $, FRI, MON, SAT, SUN, THU, TUE, WED, type SeedCategory } from "./types";

const HH_NOTE = "Happy Hour Tue-Sat 3-6pm: $2 off";
const WINE_HH = "Happy Hour Tue-Sat 3-6pm: $8 glass / $32 bottle";
const FRI_SAT = { type: "days" as const, days: [FRI, SAT], note: "Fri & Sat only" };

const BREAKFAST_ADD = ["breakfast_meats_extras", "breakfast_sauces"];
const BUILD_YOUR_OWN = ["breakfast_basics", ...BREAKFAST_ADD];

export const MENU: SeedCategory[] = [
  /* ================================================================ */
  /* SOUTH WESTERN BREAKFAST                                          */
  /* ================================================================ */
  {
    name: "South Western Breakfast",
    slug: "breakfast",
    description: "South Western breakfast classics, or build your own on a housemade flour tortilla, biscuit, bagel or toast.",
    hoursNote: "'Til 11:30am every day",
    hoursCategory: "breakfast",
    days: [MON, TUE, WED, THU, FRI, SAT],
    end: "11:30",
    sections: [
      {
        name: "Classics",
        description: "Add to these from 'MEATS & EXTRAS!' and 'SAUCES' below",
        items: [
          {
            name: "Breakfast Burrito",
            price: $(6.95),
            description: "egg + crispy shredded potatoes + cheddar + hatch green chiles + salsa roja in house flour tortilla",
            dietary: ["gluten-free-option", "vegetarian-option"],
            modifierGroups: BREAKFAST_ADD,
            featured: true,
          },
          {
            name: "Breakfast Sandwich",
            price: $(7.75),
            description: "egg + american + hatch green chiles on texas toast",
            dietary: ["gluten-free-option", "vegetarian-option"],
            modifierGroups: BREAKFAST_ADD,
            image: "/images/breakfast-sandwich-chorizo.jpg",
            imageAlt: "Egg & Cheese Bagel Breakfast Sandwich with Chorizo",
            featured: true,
          },
          {
            name: "Avocado Bagel",
            slug: "avocado-bagel-toast",
            price: $(9.25),
            description: "mashed avocado + pickled red onions + crushed red pepper on everything bagel",
            dietary: ["gluten-free-option", "vegan-option"],
            modifierGroups: BREAKFAST_ADD,
            image: "/images/avocado-toast.jpg",
            imageAlt: "Breakfast Avocado Toast, Casual Cafe Food",
          },
          {
            name: "Breakfast Bowl",
            price: $(7.25),
            description: "egg + cubed potatoes + cheddar + hatch green chiles + salsa roja in bowl",
            dietary: ["gluten-free-option", "vegetarian-option"],
            modifierGroups: BREAKFAST_ADD,
          },
          {
            name: "Bean Burrito",
            price: $(5.45),
            description: "refried beans + crispy shredded potatoes + cheddar in house flour tortilla",
            dietary: ["gluten-free-option", "vegan-option"],
            modifierGroups: BREAKFAST_ADD,
          },
          {
            name: "Buttermilk & Berry",
            slug: "buttermilk-and-berry",
            price: $(4.95),
            description: "housemade buttermilk biscuit + house jam",
            dietary: ["vegetarian-option"],
            modifierGroups: BREAKFAST_ADD,
          },
        ],
      },
      {
        name: "Build Your Own!",
        slug: "build-your-own",
        items: [
          { name: "Housemade Flour Tortilla", slug: "housemade-flour-tortilla", price: $(2), modifierGroups: BUILD_YOUR_OWN },
          { name: "2x Corn Tortilla", slug: "corn-tortilla-2x", price: $(2), modifierGroups: BUILD_YOUR_OWN },
          { name: "Burrito Bowl", price: $(2), modifierGroups: BUILD_YOUR_OWN },
          { name: "Buttermilk Biscuit", slug: "housemade-biscuit", price: $(3), modifierGroups: [...BUILD_YOUR_OWN, "spreads"] },
          { name: "Everything Bagel", price: $(3), dietary: ["vegan"], modifierGroups: [...BUILD_YOUR_OWN, "spreads"] },
          { name: "Potato Bun", price: $(3), modifierGroups: [...BUILD_YOUR_OWN, "spreads"] },
          { name: "Texas Toast", price: $(3), modifierGroups: [...BUILD_YOUR_OWN, "spreads"] },
        ],
      },
      { name: "Basics", type: "addons", linkedGroup: "breakfast_basics" },
      { name: "Meats & Extras!", slug: "meats-and-extras", type: "addons", linkedGroup: "breakfast_meats_extras" },
      { name: "Sauces", type: "addons", linkedGroup: "breakfast_sauces" },
      { name: "Spreads", description: "$2 each", type: "addons", linkedGroup: "spreads" },
      {
        name: "Kids Menu",
        slug: "kids",
        items: [
          {
            name: "Avo Bun",
            slug: "avocado-bun",
            price: $(5),
            description: "mashed avocado on potato bun",
            dietary: ["gluten-free-option", "vegan-option"],
          },
          {
            name: "PB & J",
            slug: "pb-and-j",
            price: $(4),
            description: "peanut butter & house jam on toast",
            dietary: ["gluten-free-option", "vegetarian-option"],
          },
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
    description: "Texas craft barbecue smoked on site: cowboy plates, sandwiches, family platters and the meat market. Early sellout possible.",
    hoursNote: "Wed-Sat 11:30am-9pm · Happy hour 3-6pm",
    hoursCategory: "bbq",
    days: [WED, THU, FRI, SAT],
    start: "11:30",
    end: "21:00",
    sections: [
      {
        name: "Cowboy Plates",
        description: "w. 2 sides, tortilla, sauce, & pickles",
        items: [
          {
            name: "1 Meat Plate",
            slug: "one-meat-plate",
            price: $(18),
            description: "w. 2 sides, tortilla, sauce, & pickles",
            dietary: ["gluten-free-option"],
            notes: "Brisket +$3 · Spare Ribs +$2 · Add cornbread $2 · Add a side $4",
            modifierGroups: ["cowboy_meat_1", "cowboy_addons"],
            image: "/images/bbq-platter-mac.jpg",
            imageAlt: "Best Texas Craft BBQ Platter in Richmond! Smoked Meats, Homemade Mac n Cheese",
            featured: true,
          },
          {
            name: "2 Meat Plate",
            slug: "two-meat-plate",
            price: $(25),
            description: "w. 2 sides, tortilla, sauce, & pickles",
            dietary: ["gluten-free-option"],
            notes: "Brisket +$3 · Spare Ribs +$2 · Add cornbread $2 · Add a side $4",
            modifierGroups: ["cowboy_meat_2", "cowboy_addons"],
            image: "/images/bbq-platter-full.jpg",
            imageAlt: "Texas Craft Barbecue Platter with Smoked Meats and Homemade Sides",
          },
        ],
      },
      {
        // Printed as one box: "19 w. side + soda · 14 a la carte (+3 Brisket)", meat from THE MEATS list.
        name: "Sandwiches",
        items: [
          {
            name: "Sandwich, a la carte",
            slug: "sandwich-a-la-carte",
            price: $(14),
            dietary: ["gluten-free-option"],
            notes: "Brisket +$3",
            modifierGroups: ["sandwich_meat", "top_it_sandwich"],
          },
          {
            name: "Sandwich w. Side + Soda",
            slug: "sandwich-with-side-and-soda",
            price: $(19),
            description: "w. side + soda",
            dietary: ["gluten-free-option"],
            notes: "Brisket +$3",
            modifierGroups: ["sandwich_meat", "top_it_sandwich"],
          },
        ],
      },
      {
        name: "Mug Faves",
        items: [
          {
            name: "Smokehouse Burger",
            slug: "smokehouse-cheeseburger",
            price: $(17),
            description:
              "thicc ½ lb patty + american cheese + hatch green chile aioli + pickles + LTO on toasted potato bun. french fries",
            dietary: ["gluten-free-option"],
            notes: "Add bacon jam $2",
            modifierGroups: ["bbq_burger_addons"],
          },
          {
            name: "Smoky Mug Sampler",
            price: $(24),
            description: "2 wings + 1 taco* + 1 mini nachos* + 2 smoked meat sample bites* + tortilla + pickles",
            notes: "*choice for tacos, nachos, and meat samples: chicken, carnitas, chorizo, turkey, bean, papas, tofu",
            modifierGroups: ["sampler_choice"],
          },
          {
            name: "Chicken Wings",
            price: $(12),
            description: "smoked + fried + sauced (bbq, buffalo, dry rub, mustard). ranch or bleu cheese to dip. 6 pcs",
            // gfo is printed; vegan-option kept from the old seed because the item text says "try the vegan tofu option!!"
            dietary: ["gluten-free-option", "vegan-option"],
            notes: "try the vegan tofu option!!",
            modifierGroups: ["wings_sauce", "wings_dip", "wings_vegan"],
          },
          {
            name: "Smokehouse Salad",
            price: $(12),
            description: "romaine + cowboy caviar + pico + pickled red onions + tortilla strips + mustard vin. + pulled pork/chicken",
            dietary: ["gluten-free-option", "vegan-option"],
            modifierGroups: ["salad_protein"],
          },
        ],
      },
      {
        name: "Family Platters",
        items: [
          {
            name: "Large Family Platter",
            price: $(120),
            description: "1 lb brisket, 2 lb pulled pork, 2 sausages, 3 lg sides, 8 tortillas, pickles",
            image: "/images/bbq-platter-mac.jpg",
            imageAlt: "Best Texas Craft BBQ Platter in Richmond! Smoked Meats, Homemade Mac n Cheese",
          },
          {
            name: "Small Family Platter",
            price: $(75),
            description: "1/2 lb brisket, 1 lb pulled pork, 1 sausage, 2 lg sides, 4 tortillas, pickles",
            image: "/images/bbq-platter-full.jpg",
            imageAlt: "Texas Craft Barbecue Platter with Smoked Meats and Homemade Sides",
          },
        ],
      },
      {
        // TODO 2026-menu: the 2026 Meat Market prints no units (the old menu said 1/2 lb, link, 1/2 pint).
        // Names carry no unit until the owner confirms; old slugs kept for deep links.
        name: "Meat Market",
        items: [
          {
            name: "Brisket",
            slug: "brisket-half-lb",
            price: $(19),
            image: "/images/brisket-sliced.jpg",
            imageAlt: "Best Texas Craft BBQ Smoked Brisket in Richmond!",
            featured: true,
          },
          { name: "Pulled Pork", slug: "pulled-pork-half-lb", price: $(15) },
          {
            name: "House Sausage",
            slug: "sausage-link",
            price: $(9),
            image: "/images/chorizo-sausage.jpg",
            imageAlt: "Homemade Smoked Sausage, Chorizo",
          },
          { name: "Chorizo (beef, cooked)", slug: "chorizo-beef-cooked", price: $(15) },
          { name: "Turkey Breast", slug: "smoked-turkey-half-lb", price: $(15) },
          { name: "Smoked Chicken Salad", slug: "smoked-chicken-salad-half-pint", price: $(14) },
          { name: "Pork Belly Burnt Ends", slug: "pork-belly-burnt-ends-half-lb", price: $(16), availability: FRI_SAT },
          {
            name: "Pork Spare Ribs",
            slug: "spare-ribs-half-lb",
            price: $(13),
            availability: FRI_SAT,
            image: "/images/spare-ribs-sliced.jpg",
            imageAlt: "Texas Craft BBQ Smoked Spare Ribs, Slow Cooked",
            featured: true,
          },
        ],
      },
      {
        name: "Sides",
        description: "Small 5.50 / Large 10",
        items: [
          {
            name: "Hatch Chile Mac n Cheese",
            // Printed "(+$1)" over the Small 5.50 / Large 10 side price.
            price: $(6.5),
            large: $(11),
            dietary: ["gluten-free-option", "vegetarian-option"],
            notes: "+$1 over base side price (SM $5.50 / LG $10)",
            featured: true,
          },
          { name: "Refried Beans", slug: "refried-beans-side", price: $(5.5), large: $(10), dietary: ["gluten-free-option", "vegan-option"] },
          { name: "Crispy Potatoes", slug: "fried-potatoes", price: $(5.5), large: $(10), dietary: ["vegan-option"] },
          { name: "Potato Salad", slug: "mostaza-potato-salad", price: $(5.5), large: $(10), dietary: ["gluten-free-option", "vegetarian-option"] },
          { name: "Tejano Slaw", price: $(5.5), large: $(10), dietary: ["gluten-free-option", "vegetarian-option"] },
          { name: "Hand-cut French Fries", slug: "hand-cut-french-fries", price: $(5.5), large: $(10), dietary: ["vegan-option"] },
          // No mark printed in 2026; gfo kept from the old seed.
          { name: "Collard Greens (w. rib tips)", slug: "collard-greens", price: $(5.5), large: $(10), dietary: ["gluten-free-option"] },
        ],
      },
      { name: "Sauces", description: "house made $0.75 extra", type: "addons", linkedGroup: "bbq_sauces" },
    ],
  },

  /* ================================================================ */
  /* TEX MEX                                                          */
  /* ================================================================ */
  {
    name: "Tex Mex",
    slug: "tex-mex",
    description: "Tacos, nacho platters and chips y mas, with smoked meats or veg & vegan fillings.",
    hoursNote: "Tue-Sat 11:30am-9pm · Taco Tuesday: happy hour tacos all day",
    hoursCategory: "tex_mex",
    days: [TUE, WED, THU, FRI, SAT],
    start: "11:30",
    end: "21:00",
    sections: [
      {
        name: "Tacos",
        description: "Choose your meat/veg & top it",
        items: [
          {
            name: "1 Taco",
            slug: "one-taco",
            price: $(4.25),
            // gfo is printed; vegetarian-option kept from the old seed (the "Veg & Vegan" fillings are printed).
            dietary: ["gluten-free-option", "vegetarian-option"],
            notes: "Brisket: see Mug Faves · Pork Belly B.E. +$1/taco",
            happyHour: "Happy Hour 3-6pm: 1 for $3.25 · Taco Tuesdays: happy hour tacos all day",
            modifierGroups: ["taco_filling_1", "top_it_taco"],
          },
          {
            name: "3 Tacos",
            slug: "three-tacos",
            price: $(11),
            dietary: ["gluten-free-option", "vegetarian-option"],
            notes: "Brisket: see Mug Faves · Pork Belly B.E. +$1/taco",
            happyHour: "Happy Hour 3-6pm: 3 for $9.25 · Taco Tuesdays: happy hour tacos all day",
            modifierGroups: ["taco_filling_3", "top_it_taco"],
            featured: true,
          },
        ],
      },
      {
        name: "Nacho Platter",
        items: [
          {
            name: "Nacho Platter",
            price: $(21),
            priceNote: "w. choice meat/veg",
            description: "Queso, tejano slaw, salsa verde, crema, grated jack, guac, & onion-cilantro",
            // TODO 2026-menu: no dietary mark is visible on the printed Nacho Platter (the PDF text layer has a
            // stray "gf" near the heading). Old seed tags kept until the owner confirms.
            dietary: ["gluten-free-option", "vegetarian-option"],
            notes: "+6 Brisket · +3 Pork Belly B.E. · +3 Chorizo · Add cowboy caviar $3",
            modifierGroups: ["nacho_protein", "nacho_addons"],
          },
        ],
      },
      {
        name: "Mug Faves",
        items: [
          {
            name: "Brisket Taco",
            price: $(13),
            description: "beans + salsa verde + salsa roja + onion-cilantro",
            dietary: ["gluten-free-option"],
            happyHour: "Happy Hour 3-6pm: $2 off",
            image: "/images/brisket-taco.jpg",
            imageAlt: "Tex Mex Brisket Taco on Fresh Homemade Tortilla",
            featured: true,
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
            description: "Chips + 3 dips",
            dietary: ["gluten-free-option", "vegan-option"],
            modifierGroups: ["flight_dips"],
          },
          { name: "Guacamole", price: $(6), dietary: ["gluten-free-option", "vegan-option"] },
          { name: "Queso", price: $(6), dietary: ["gluten-free-option", "vegan-option"] },
          { name: "Chips", price: $(2), dietary: ["gluten-free-option", "vegan-option"] },
          { name: "Refried Beans", slug: "refried-beans-dip", price: $(5), dietary: ["gluten-free-option", "vegan-option"] },
          { name: "Salsa Roja", price: $(5), dietary: ["gluten-free-option", "vegan-option"] },
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
    hoursNote: "Sundays 9:30am-2:30pm",
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
            price: $(19),
            description:
              "brisket + over-medium eggs* on housemade buttermilk biscuit, smothered with hatch green chile hollandaise. topped with onion-cilantro relish. side potatoes & fruit",
            featured: true,
          },
          {
            name: "P.B.L.T",
            slug: "pblt",
            price: $(18),
            description: "smoked pork belly + lettuce + tomato + hatch green chile aioli on texas toast. side potatoes & fruit",
            dietary: ["gluten-free-option"],
          },
          {
            name: "Breakfast Nachos",
            price: $(16),
            description: "tortilla chips + scramble + queso + salsa verde + potatoes + crema + grated jack + guac",
            dietary: ["gluten-free-option", "vegetarian-option"],
            modifierGroups: ["breakfast_nacho_addons"],
          },
          {
            name: "Huevos Rancheros",
            price: $(17),
            description:
              "carnitas + beans + over-medium eggs* on tostada, covered in ranchero sauce + grated jack + onion-cilantro relish. side potatoes & fruit",
            dietary: ["gluten-free-option", "vegan-option"],
          },
          {
            name: "Smokehouse Burger",
            slug: "brunch-smokehouse-cheeseburger",
            price: $(17),
            description:
              "thicc ½ lb patty + american cheese + hatch green chile aioli + pickles + LTO on toasted potato bun. french fries",
            // No mark printed on the brunch page (the BBQ page prints gfo for the same burger); old tag kept.
            dietary: ["gluten-free-option"],
            notes: "Add egg +$3 · Add bacon jam $2",
            modifierGroups: ["brunch_burger_addons"],
          },
          {
            name: "Southwest Pancakes",
            price: $(14),
            description: "4-pancake stack. side potatoes & fruit",
            dietary: ["vegetarian-option"],
            modifierGroups: ["pancake_style", "pancake_addons"],
          },
          {
            name: "Biscuits 'n Hatch Gravy",
            slug: "biscuits-n-hatch-gravy",
            price: $(16),
            description: "buttermilk biscuit split & smothered in hatch green chile-sausage breakfast gravy & over-medium eggs",
          },
          {
            name: "Chicken & Churros",
            slug: "chicken-and-churros",
            price: $(18),
            description: "hot chicken thigh, smoked and fried + churros + syrup. side potatoes & fruit",
          },
          {
            name: "Breakfast Burrito",
            slug: "brunch-breakfast-burrito",
            price: $(6.95),
            description: "egg + potatoes + cheddar + hatch green chiles + salsa roja in house flour tortilla",
            dietary: ["gluten-free-option", "vegetarian-option"],
            modifierGroups: ["burrito_addins", "burrito_addons"],
          },
        ],
      },
      {
        name: "Brunch Bar",
        items: [
          // TODO 2026-menu: printed "cava + juice [flavors | OJ, strawberry, peach" (bracket never closed); flavors modelled as a choice.
          { name: "Mimosa", price: $(8), description: "cava + juice", modifierGroups: ["mimosa_flavor"] },
          { name: "Bloody", price: $(8), description: "vodka / tequila + bloody mix", modifierGroups: ["bloody_spirit"] },
          { name: "Paloma", price: $(12), description: "tequila + lime + grapefruit + sparkling" },
          // TODO 2026-menu: "tequilla" and "chilie" are printed typos (old seed: tequila, chile). Transcribed as printed.
          { name: "Mexican Coffee", price: $(12), description: "tequilla + coffee + chilie powder + chocolate + cream" },
          { name: "Pitchers", slug: "pitchers", price: $(28), description: "mimosa | bloody", modifierGroups: ["pitcher_style"] },
        ],
      },
      {
        // No marks printed on 2026 brunch sides; old seed tags kept.
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
    description: "Drafts, cans, lunchboxes, house cocktails, old fashioneds and wine.",
    hoursNote: "Happy hour Tue-Sat 3-6pm · $2 off drafts & cocktails · $8 glass / $32 bottle wine",
    hoursCategory: "store",
    sections: [
      {
        name: "Draft",
        slug: "drafts",
        items: [
          { name: "Kung Fu Kittens", price: $(9), description: "Juicy/Hazy IPA", happyHour: HH_NOTE },
          { name: "Limelight Helles Lager", price: $(11), description: "Lager - Brewed in RVA!", happyHour: HH_NOTE },
          {
            name: "Rotating - Small Batch",
            slug: "rotating-tap",
            price: null,
            priceNote: "Varies", // printed "VAR"
            description: "Brewed in RVA! - Ask about current",
            happyHour: HH_NOTE,
          },
          { name: "Green Dart", price: $(10), description: "Pilsner", happyHour: HH_NOTE },
          { name: "Fonta Flora", price: $(10), description: "Marzen", happyHour: HH_NOTE },
          { name: "Strawberry Rhube Awakening", price: $(10), description: "Cider", happyHour: HH_NOTE },
          { name: "Pacifico", price: $(7), description: "Mexican Lager", happyHour: HH_NOTE },
          { name: "Coors Light", price: $(5), description: "Light American Lager", happyHour: HH_NOTE },
        ],
      },
      {
        name: "Cans",
        items: [
          { name: "Sacred Profane Dark Lager", price: $(8) },
          { name: "Topo Hard Seltzer", price: $(8) },
          { name: "Lonestar Lager", price: $(5) },
          { name: "Strongbow Cider", price: $(7) },
          { name: "Tecate", price: $(5) },
          { name: "Coors Banquet", price: $(5) },
          // TODO 2026-menu: printed 'QUICK DRAW"' with a lone closing quote mark; name written without it.
          { name: "Quick Draw", price: $(5), description: "Mystery Selection" },
        ],
      },
      {
        name: "Lunchboxes",
        items: [
          { name: "Tecate + Tequila", slug: "lunchbox-tecate-tequila", price: $(7) },
          { name: "Coors Banquet + Bourbon", slug: "lunchbox-coors-banquet-bourbon", price: $(8) },
        ],
      },
      {
        name: "Cocktails",
        slug: "house-cocktails",
        items: [
          // TODO 2026-menu: printed "ESPRESSO TINI'" (apostrophe after TINI; old seed had "Espresso 'Tini"). Transcribed as printed.
          { name: "Espresso Tini'", slug: "espresso-tini", price: $(13), description: "Cirrus Vodka + Espresso + Kahlua + Agave + Mole Bitters", happyHour: HH_NOTE },
          { name: "Mug Mule", price: $(11), description: "Rio J Tequila + Lime + Strawberry + Ginger Beer", happyHour: HH_NOTE },
          { name: "Ranch Water", price: $(9), description: "Rio J Tequila + Lime + Orange Bitters + Soda", happyHour: HH_NOTE },
          { name: "Guava Nice Day", price: $(13), description: "Banhez Mezcal + Guava + Lavender + Lime + Black Salt", happyHour: HH_NOTE },
          { name: "Cucumber Cutie", price: $(11), description: "Cirrus Jalapina Vodka + Cucumber + Soda", happyHour: HH_NOTE },
          {
            name: "Seasonal Cocktails",
            price: null,
            priceNote: "Ask",
            description: "Ask about our seasonal cocktails",
            notes: "Rotating",
            availability: { type: "seasonal", note: "Rotating" },
          },
        ],
      },
      {
        name: "Old Fashioneds",
        slug: "old-fashioneds",
        items: [
          {
            name: "Esmerelda O.F.",
            slug: "esmerelda-old-fashioned",
            price: $(14),
            description: "Wild Turkey 101 + Espresso Syrup + Orange Bitters",
            happyHour: HH_NOTE,
            featured: true,
          },
          {
            name: "Oaxacan O.F.",
            slug: "oaxacan-old-fashioned",
            price: $(14),
            description: "Espolon Reposado + Banhez Mezcal + Agave + Orange + Mole Bitters",
            happyHour: HH_NOTE,
          },
        ],
      },
      {
        name: "Wine",
        description: "Glass / Bottle",
        items: [
          { name: "House Red - Vegas Altas Tempranillo (Spain)", slug: "house-red-tempranillo", price: $(9), bottle: $(30), description: "Tasting notes: Fresh - Juicy - Smooth", happyHour: WINE_HH },
          { name: "House White - Chateau du Claouset Bordeaux Blanc (France)", slug: "house-white-bordeaux-blanc", price: $(9), bottle: $(30), description: "Tasting notes: Crisp - Citrus - Mineral", happyHour: WINE_HH },
          // TODO 2026-menu: printed "D'abruzo" (old seed: D'abruzzo). Transcribed as printed.
          { name: "Red - Cirelli Montepulciano D'abruzo (Italy)", slug: "red-cirelli-montepulciano", price: $(13), bottle: $(42), description: "Tasting notes: Traditional - Full - Smooth", happyHour: WINE_HH },
          { name: "Glou-Glou - Domaine Benjamin Taillandier Viti Vini Bibi (France)", slug: "glou-glou-viti-vini-bibi", price: $(10), bottle: $(36), description: "Tasting notes: Bright - Juicy - Spiced", happyHour: WINE_HH },
          { name: "Rose - Domaine des Cognettes Rose (France)", slug: "rose-domaine-des-cognettes", price: $(11), bottle: $(39), description: "Tasting notes: Crisp - Fresh - Crushable", happyHour: WINE_HH },
          { name: "White - Domaine des Cognettes Sauvignon Blanc (France)", slug: "white-domaine-des-cognettes-sauvignon-blanc", price: $(11), bottle: $(39), description: "Tasting notes: Fragrant - Zesty - Refreshing", happyHour: WINE_HH },
          { name: "Bubbly - Oriol Rossell Cava Brut Nature (Spain)", slug: "bubbly-oriol-rossell-cava", price: $(10), bottle: $(36), description: "Tasting notes: Dry - Lemon - Mineral", happyHour: WINE_HH },
          { name: "Bubbly Red - Folicello Lambrusco (Italy)", slug: "bubbly-red-folicello-lambrusco", price: $(11), bottle: $(39), description: "Tasting notes: Fizzy - Fun - Fresh", happyHour: WINE_HH },
        ],
      },
      {
        name: "Stay on Yer Horse (N.A.)",
        slug: "stay-on-yer-horse",
        description: "Non-alcoholic",
        items: [
          { name: "Desert Bloom", price: $(8), description: "Blueberry Lavender Kombucha + Ginger + Lemon", dietary: ["non-alcoholic"] },
          { name: "Cactus Cooler", price: $(9), description: "Kefir + Hibiscus + Lime + Mexican Sparkling + Smoked Salt", dietary: ["non-alcoholic"] },
          { name: "Day Ripper Pils", price: $(8), description: "non-alcoholic", dietary: ["non-alcoholic"], notes: "N.A." },
          { name: "Sun Shifter IPA", price: $(8), description: "non-alcoholic", dietary: ["non-alcoholic"], notes: "N.A." },
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
    hoursNote: "'Til 7pm (or close, if earlier)",
    hoursCategory: "cafe_drinks",
    end: "19:00",
    sections: [
      {
        name: "Hot",
        description: "Small / Large",
        items: [
          { name: "Drip Coffee", price: $(2.5), large: $(4), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Au Lait", price: $(2.75), large: $(4.25), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Americano", slug: "hot-americano", price: $(3.75), large: $(6.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Espresso", slug: "hot-espresso", price: $(3.75), large: $(6.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          // TODO 2026-menu: printed "5.95 | 4.75" (small dearer than large; old seed 4.75 | 5.95). Transcribed as printed.
          { name: "Black Eye", price: $(5.95), large: $(4.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Hot Cocoa", price: $(3.25), large: $(4.5), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Milk", slug: "hot-milk", price: $(2.5), large: $(3.75), priceNote: "Small / Large" },
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
          // TODO 2026-menu: printed "4.75 | 5.50"; large is below the hot Latte large (5.95) and the old 6.50. Transcribed as printed.
          { name: "Mocha", slug: "hot-mocha", price: $(4.75), large: $(5.5), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Flat White", price: $(4.25), large: $(5.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Chai Latte", slug: "hot-chai-latte", price: $(4.25), large: $(5.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Dirty Chai", slug: "hot-dirty-chai", price: $(6.25), large: $(7.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          // TODO 2026-menu: printed "6.25 | 7.95", identical to the Dirty Chai row (old seed 4.25 | 5.95). Transcribed as printed.
          { name: "Matcha Latte", slug: "hot-matcha-latte", price: $(6.25), large: $(7.95), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
        ],
      },
      {
        name: "Iced",
        slug: "cold-iced",
        description: "Small / Large",
        items: [
          { name: "Coffee/Tea", slug: "iced-coffee-tea", price: $(2.5), large: $(3.85), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Cold Brew", price: $(3.5), large: $(4.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Espresso", slug: "iced-espresso", price: $(3.75), large: $(6.75), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Americano", slug: "iced-americano", price: $(3.85), large: $(6.85), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Milk", slug: "iced-milk", price: $(2.6), large: $(3.85), priceNote: "Small / Large" },
          // TODO 2026-menu: one price printed, sitting in the Large column; size not stated. Possibly the old "Topo Soda" renamed.
          { name: "Dirty Soda", price: $(4.75) },
          { name: "Latte", slug: "iced-latte", price: $(4.35), large: $(6), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Mocha", slug: "iced-mocha", price: $(4.85), large: $(6.55), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Chai Latte", slug: "iced-chai-latte", price: $(4.35), large: $(6.05), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          { name: "Dirty Chai", slug: "iced-dirty-chai", price: $(6.35), large: $(8.05), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
          // TODO 2026-menu: printed "4.35 | 8.05"; large matches iced Dirty Chai, not iced Chai Latte 6.05 (old seed 4.35 | 6.05). Transcribed as printed.
          { name: "Matcha Latte", slug: "iced-matcha-latte", price: $(4.35), large: $(8.05), priceNote: "Small / Large", modifierGroups: ["drink_options"] },
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
        ],
      },
      {
        name: "Other",
        items: [
          { name: "Fountain Soda", price: $(2.5) },
          { name: "Mexi-Coke", price: $(4.25) },
          { name: "Topo Chico", price: $(4.25) },
          { name: "Orange Juice", price: $(5.5) },
          { name: "Kombucha", price: $(5.95) },
          { name: "Apple Juice", price: $(3.95) },
          {
            name: "Affogato",
            price: $(5.95),
            description: "smoked cinnamon dolce ice cream + espresso. Ice cream by ruby scoops",
          },
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
