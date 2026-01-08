export type ThemeCategory =
  | 'Pop Culture'
  | 'Absurd Scenarios'
  | 'Mashups'
  | 'Vibes'
  | 'Challenges'
  | 'Art Style Twists'
  | 'Relatable Moments';

export interface Theme {
  id: string;
  text: string;
  category: ThemeCategory;
}

export const THEME_CATEGORIES: ThemeCategory[] = [
  'Pop Culture',
  'Absurd Scenarios',
  'Mashups',
  'Vibes',
  'Challenges',
  'Art Style Twists',
  'Relatable Moments',
];

const themes: Theme[] = [
  // Pop Culture (25+ themes)
  { id: 'pc-1', text: 'A superhero having an existential crisis at a coffee shop', category: 'Pop Culture' },
  { id: 'pc-2', text: 'Darth Vader at a parent-teacher conference', category: 'Pop Culture' },
  { id: 'pc-3', text: 'Mario and Luigi starting a plumbing business', category: 'Pop Culture' },
  { id: 'pc-4', text: 'Pokemon gym but for humans', category: 'Pop Culture' },
  { id: 'pc-5', text: 'Hogwarts but everyone has smartphones', category: 'Pop Culture' },
  { id: 'pc-6', text: 'The Avengers at an awkward office party', category: 'Pop Culture' },
  { id: 'pc-7', text: 'Disney villains at a support group', category: 'Pop Culture' },
  { id: 'pc-8', text: 'Godzilla trying to use public transportation', category: 'Pop Culture' },
  { id: 'pc-9', text: 'James Bond at a boring suburban BBQ', category: 'Pop Culture' },
  { id: 'pc-10', text: 'The Mandalorian babysitting regular human children', category: 'Pop Culture' },
  { id: 'pc-11', text: 'Gandalf giving a TED talk', category: 'Pop Culture' },
  { id: 'pc-12', text: 'Batman reviewing his Yelp ratings', category: 'Pop Culture' },
  { id: 'pc-13', text: 'Shrek at a fancy gala', category: 'Pop Culture' },
  { id: 'pc-14', text: 'SpongeBob in a corporate office environment', category: 'Pop Culture' },
  { id: 'pc-15', text: 'The Joker doing stand-up comedy to silence', category: 'Pop Culture' },
  { id: 'pc-16', text: 'Thor trying to assemble IKEA furniture', category: 'Pop Culture' },
  { id: 'pc-17', text: 'Elsa explaining climate change', category: 'Pop Culture' },
  { id: 'pc-18', text: 'Pikachu testifying in court', category: 'Pop Culture' },
  { id: 'pc-19', text: 'John Wick at a dog park', category: 'Pop Culture' },
  { id: 'pc-20', text: 'Thanos at a farmers market', category: 'Pop Culture' },
  { id: 'pc-21', text: 'Yoda as a life coach', category: 'Pop Culture' },
  { id: 'pc-22', text: 'The Terminator as a customer service rep', category: 'Pop Culture' },
  { id: 'pc-23', text: 'Sonic the Hedgehog at the DMV', category: 'Pop Culture' },
  { id: 'pc-24', text: 'Voldemort at a nose job consultation', category: 'Pop Culture' },
  { id: 'pc-25', text: 'Groot as a motivational speaker', category: 'Pop Culture' },

  // Absurd Scenarios (25+ themes)
  { id: 'as-1', text: 'Cats having a board meeting about world domination', category: 'Absurd Scenarios' },
  { id: 'as-2', text: 'A sloth winning a Formula 1 race', category: 'Absurd Scenarios' },
  { id: 'as-3', text: 'Fish walking dogs in the park', category: 'Absurd Scenarios' },
  { id: 'as-4', text: 'Vegetables protesting in the produce aisle', category: 'Absurd Scenarios' },
  { id: 'as-5', text: 'A toaster going through an identity crisis', category: 'Absurd Scenarios' },
  { id: 'as-6', text: 'Clouds competing in a beauty pageant', category: 'Absurd Scenarios' },
  { id: 'as-7', text: 'A penguin as a tropical tour guide', category: 'Absurd Scenarios' },
  { id: 'as-8', text: 'Dinosaurs discovering social media', category: 'Absurd Scenarios' },
  { id: 'as-9', text: 'A burrito running for president', category: 'Absurd Scenarios' },
  { id: 'as-10', text: 'Aliens trying to understand golf', category: 'Absurd Scenarios' },
  { id: 'as-11', text: 'A lamp applying for a job as a lighthouse', category: 'Absurd Scenarios' },
  { id: 'as-12', text: 'Snowmen at a beach resort', category: 'Absurd Scenarios' },
  { id: 'as-13', text: 'A doorbell at a therapy session', category: 'Absurd Scenarios' },
  { id: 'as-14', text: 'Squirrels planning a heist at a nut factory', category: 'Absurd Scenarios' },
  { id: 'as-15', text: 'A coffee mug leading a revolution', category: 'Absurd Scenarios' },
  { id: 'as-16', text: 'Socks disappearing into another dimension', category: 'Absurd Scenarios' },
  { id: 'as-17', text: 'A cactus at a hugging convention', category: 'Absurd Scenarios' },
  { id: 'as-18', text: 'Giraffes playing limbo', category: 'Absurd Scenarios' },
  { id: 'as-19', text: 'A traffic cone as a fashion icon', category: 'Absurd Scenarios' },
  { id: 'as-20', text: 'Bread going to a bakery funeral', category: 'Absurd Scenarios' },
  { id: 'as-21', text: 'A WiFi router as a relationship counselor', category: 'Absurd Scenarios' },
  { id: 'as-22', text: 'Staplers forming a union', category: 'Absurd Scenarios' },
  { id: 'as-23', text: 'A balloon at an acupuncture clinic', category: 'Absurd Scenarios' },
  { id: 'as-24', text: 'Rubber ducks taking over the navy', category: 'Absurd Scenarios' },
  { id: 'as-25', text: 'A pillow starting a fight club', category: 'Absurd Scenarios' },

  // Mashups (25+ themes)
  { id: 'ma-1', text: 'Medieval knights at a rave', category: 'Mashups' },
  { id: 'ma-2', text: 'Samurai in a cyberpunk convenience store', category: 'Mashups' },
  { id: 'ma-3', text: 'Vikings discovering yoga', category: 'Mashups' },
  { id: 'ma-4', text: 'Pirates running a tech startup', category: 'Mashups' },
  { id: 'ma-5', text: 'Cavemen at an art museum', category: 'Mashups' },
  { id: 'ma-6', text: 'Robots at a Renaissance fair', category: 'Mashups' },
  { id: 'ma-7', text: 'Gladiators at a cooking competition', category: 'Mashups' },
  { id: 'ma-8', text: 'Wizards at a science fair', category: 'Mashups' },
  { id: 'ma-9', text: 'Astronauts in a Wild West saloon', category: 'Mashups' },
  { id: 'ma-10', text: 'Pharaohs at a modern airport', category: 'Mashups' },
  { id: 'ma-11', text: 'Ninjas at a PTA meeting', category: 'Mashups' },
  { id: 'ma-12', text: 'Greek gods using dating apps', category: 'Mashups' },
  { id: 'ma-13', text: 'Cowboys at a sushi restaurant', category: 'Mashups' },
  { id: 'ma-14', text: 'Dragons at a dentist appointment', category: 'Mashups' },
  { id: 'ma-15', text: 'Mermaids at a car dealership', category: 'Mashups' },
  { id: 'ma-16', text: 'Zombies at a wellness retreat', category: 'Mashups' },
  { id: 'ma-17', text: 'Fairies at a construction site', category: 'Mashups' },
  { id: 'ma-18', text: 'Vampires at a blood drive (as volunteers)', category: 'Mashups' },
  { id: 'ma-19', text: 'Centaurs at a driving school', category: 'Mashups' },
  { id: 'ma-20', text: 'Elves at Black Friday shopping', category: 'Mashups' },
  { id: 'ma-21', text: 'Werewolves at a dog grooming salon', category: 'Mashups' },
  { id: 'ma-22', text: 'Trolls as influencers', category: 'Mashups' },
  { id: 'ma-23', text: 'Ghosts at a home inspection', category: 'Mashups' },
  { id: 'ma-24', text: 'Giants at a miniature golf course', category: 'Mashups' },
  { id: 'ma-25', text: 'Unicorns at a punk rock concert', category: 'Mashups' },

  // Vibes (25+ themes)
  { id: 'vi-1', text: 'Cozy chaos energy', category: 'Vibes' },
  { id: 'vi-2', text: 'That 3 AM clarity', category: 'Vibes' },
  { id: 'vi-3', text: 'Feral but professional', category: 'Vibes' },
  { id: 'vi-4', text: 'Unhinged optimism', category: 'Vibes' },
  { id: 'vi-5', text: 'Chaotic neutral energy', category: 'Vibes' },
  { id: 'vi-6', text: 'Soft apocalypse aesthetic', category: 'Vibes' },
  { id: 'vi-7', text: 'Suburban surrealism', category: 'Vibes' },
  { id: 'vi-8', text: 'Melancholy disco', category: 'Vibes' },
  { id: 'vi-9', text: 'Wholesome menace', category: 'Vibes' },
  { id: 'vi-10', text: 'Accidental main character', category: 'Vibes' },
  { id: 'vi-11', text: 'Aggressive relaxation', category: 'Vibes' },
  { id: 'vi-12', text: 'Nostalgic for something that never existed', category: 'Vibes' },
  { id: 'vi-13', text: 'Corporate mysticism', category: 'Vibes' },
  { id: 'vi-14', text: 'Domestic eldritch horror', category: 'Vibes' },
  { id: 'vi-15', text: 'Chaotic cottagecore', category: 'Vibes' },
  { id: 'vi-16', text: 'Unhinged serenity', category: 'Vibes' },
  { id: 'vi-17', text: 'Liminal space romance', category: 'Vibes' },
  { id: 'vi-18', text: 'Aggressively mediocre', category: 'Vibes' },
  { id: 'vi-19', text: 'Tired but iconic', category: 'Vibes' },
  { id: 'vi-20', text: 'Casual existential dread', category: 'Vibes' },
  { id: 'vi-21', text: 'Suburban gothic', category: 'Vibes' },
  { id: 'vi-22', text: 'Fever dream energy', category: 'Vibes' },
  { id: 'vi-23', text: 'Ominously cheerful', category: 'Vibes' },
  { id: 'vi-24', text: 'Glamorous exhaustion', category: 'Vibes' },
  { id: 'vi-25', text: 'Anxious utopia', category: 'Vibes' },

  // Challenges (25+ themes)
  { id: 'ch-1', text: 'Create the most unsettling stock photo', category: 'Challenges' },
  { id: 'ch-2', text: 'Design a mascot for a questionable product', category: 'Challenges' },
  { id: 'ch-3', text: 'Make a boring object look epic', category: 'Challenges' },
  { id: 'ch-4', text: 'Illustrate a mundane task dramatically', category: 'Challenges' },
  { id: 'ch-5', text: 'Create the worst possible tourism poster', category: 'Challenges' },
  { id: 'ch-6', text: 'Design a confusing warning sign', category: 'Challenges' },
  { id: 'ch-7', text: 'Make a terrifying children\'s book cover', category: 'Challenges' },
  { id: 'ch-8', text: 'Create cursed comfort food', category: 'Challenges' },
  { id: 'ch-9', text: 'Design the least helpful self-help book cover', category: 'Challenges' },
  { id: 'ch-10', text: 'Make a passive-aggressive greeting card', category: 'Challenges' },
  { id: 'ch-11', text: 'Create a suspicious motivational poster', category: 'Challenges' },
  { id: 'ch-12', text: 'Design the worst possible album cover', category: 'Challenges' },
  { id: 'ch-13', text: 'Make a threatening welcome mat', category: 'Challenges' },
  { id: 'ch-14', text: 'Create an ominous calendar photo', category: 'Challenges' },
  { id: 'ch-15', text: 'Design a concerning theme park ride', category: 'Challenges' },
  { id: 'ch-16', text: 'Make a chaotic cooking tutorial scene', category: 'Challenges' },
  { id: 'ch-17', text: 'Create the most uncomfortable family portrait', category: 'Challenges' },
  { id: 'ch-18', text: 'Design a suspicious cereal box', category: 'Challenges' },
  { id: 'ch-19', text: 'Make a dubious fitness advertisement', category: 'Challenges' },
  { id: 'ch-20', text: 'Create an unsettling dating profile photo', category: 'Challenges' },
  { id: 'ch-21', text: 'Design a worrying company logo', category: 'Challenges' },
  { id: 'ch-22', text: 'Make a questionable movie poster', category: 'Challenges' },
  { id: 'ch-23', text: 'Create concerning yard sale signage', category: 'Challenges' },
  { id: 'ch-24', text: 'Design the worst possible t-shirt graphic', category: 'Challenges' },
  { id: 'ch-25', text: 'Make an accidentally threatening billboard', category: 'Challenges' },

  // Art Style Twists (25+ themes)
  { id: 'ar-1', text: 'A famous painting but everyone is cats', category: 'Art Style Twists' },
  { id: 'ar-2', text: 'Renaissance portrait of a modern influencer', category: 'Art Style Twists' },
  { id: 'ar-3', text: 'Soviet propaganda poster for pizza delivery', category: 'Art Style Twists' },
  { id: 'ar-4', text: 'Art nouveau style tech startup logo', category: 'Art Style Twists' },
  { id: 'ar-5', text: 'Baroque painting of a midnight snack', category: 'Art Style Twists' },
  { id: 'ar-6', text: 'Impressionist painting of a traffic jam', category: 'Art Style Twists' },
  { id: 'ar-7', text: 'Cubist portrait of a confused customer', category: 'Art Style Twists' },
  { id: 'ar-8', text: 'Medieval illuminated manuscript about WiFi', category: 'Art Style Twists' },
  { id: 'ar-9', text: 'Japanese woodblock print of a fast food drive-through', category: 'Art Style Twists' },
  { id: 'ar-10', text: 'Pop art style grocery list', category: 'Art Style Twists' },
  { id: 'ar-11', text: 'Ancient Egyptian hieroglyphics of modern life', category: 'Art Style Twists' },
  { id: 'ar-12', text: 'Rococo painting of a Discord server', category: 'Art Style Twists' },
  { id: 'ar-13', text: 'Byzantine mosaic of a video game character', category: 'Art Style Twists' },
  { id: 'ar-14', text: 'Art deco poster for remote work', category: 'Art Style Twists' },
  { id: 'ar-15', text: 'Minimalist Japanese style chaos', category: 'Art Style Twists' },
  { id: 'ar-16', text: 'Romantic era painting of a coffee addiction', category: 'Art Style Twists' },
  { id: 'ar-17', text: 'Surrealist interpretation of Zoom meetings', category: 'Art Style Twists' },
  { id: 'ar-18', text: 'Pointillism masterpiece of a messy room', category: 'Art Style Twists' },
  { id: 'ar-19', text: 'Cave painting depicting modern problems', category: 'Art Style Twists' },
  { id: 'ar-20', text: 'Stained glass window of online shopping', category: 'Art Style Twists' },
  { id: 'ar-21', text: 'Manga style historical event', category: 'Art Style Twists' },
  { id: 'ar-22', text: 'Oil painting style meme', category: 'Art Style Twists' },
  { id: 'ar-23', text: 'Ancient Greek pottery depicting brunch', category: 'Art Style Twists' },
  { id: 'ar-24', text: 'Victorian portrait of a gamer', category: 'Art Style Twists' },
  { id: 'ar-25', text: 'Abstract expressionism of Monday morning', category: 'Art Style Twists' },

  // Relatable Moments (25+ themes)
  { id: 'rm-1', text: 'When you wave back at someone who wasn\'t waving at you', category: 'Relatable Moments' },
  { id: 'rm-2', text: 'Pretending to read the menu when you already know what you want', category: 'Relatable Moments' },
  { id: 'rm-3', text: 'That moment when you forget someone\'s name mid-introduction', category: 'Relatable Moments' },
  { id: 'rm-4', text: 'Looking busy when the boss walks by', category: 'Relatable Moments' },
  { id: 'rm-5', text: 'The Sunday scaries personified', category: 'Relatable Moments' },
  { id: 'rm-6', text: 'When you pull a push door in front of people', category: 'Relatable Moments' },
  { id: 'rm-7', text: 'Saying "you too" when the waiter says enjoy your meal', category: 'Relatable Moments' },
  { id: 'rm-8', text: 'The walk of shame back for your forgotten item', category: 'Relatable Moments' },
  { id: 'rm-9', text: 'When your brain plays a song on repeat at 3 AM', category: 'Relatable Moments' },
  { id: 'rm-10', text: 'Nodding along when you stopped listening 5 minutes ago', category: 'Relatable Moments' },
  { id: 'rm-11', text: 'The panic when someone asks to see your search history', category: 'Relatable Moments' },
  { id: 'rm-12', text: 'When autocorrect betrays you in a professional email', category: 'Relatable Moments' },
  { id: 'rm-13', text: 'Rehearsing a conversation that will never happen', category: 'Relatable Moments' },
  { id: 'rm-14', text: 'The look when your food arrives and it\'s not what you ordered', category: 'Relatable Moments' },
  { id: 'rm-15', text: 'When you\'ve been on "I\'ll leave in 5 minutes" for an hour', category: 'Relatable Moments' },
  { id: 'rm-16', text: 'The betrayal of a chair that almost tips over', category: 'Relatable Moments' },
  { id: 'rm-17', text: 'When someone starts typing after you send a vulnerable text', category: 'Relatable Moments' },
  { id: 'rm-18', text: 'The energy of "I should probably go to sleep" at 2 AM', category: 'Relatable Moments' },
  { id: 'rm-19', text: 'When you accidentally make eye contact with a stranger twice', category: 'Relatable Moments' },
  { id: 'rm-20', text: 'The walk when you realize you\'re going the wrong way', category: 'Relatable Moments' },
  { id: 'rm-21', text: 'When your charger only works at a specific angle', category: 'Relatable Moments' },
  { id: 'rm-22', text: 'The betrayal of stepping in water with socks on', category: 'Relatable Moments' },
  { id: 'rm-23', text: 'When you hear your own voice in a recording', category: 'Relatable Moments' },
  { id: 'rm-24', text: 'The anxiety of someone watching you type', category: 'Relatable Moments' },
  { id: 'rm-25', text: 'When you can\'t remember if you locked the door', category: 'Relatable Moments' },
];

export function getAllThemes(): Theme[] {
  return [...themes];
}

export function getThemesByCategory(category: ThemeCategory): Theme[] {
  return themes.filter((theme) => theme.category === category);
}

export function getRandomTheme(
  category: ThemeCategory | 'All Categories',
  excludeIds: Set<string> = new Set()
): Theme | null {
  const availableThemes =
    category === 'All Categories'
      ? themes.filter((theme) => !excludeIds.has(theme.id))
      : themes.filter((theme) => theme.category === category && !excludeIds.has(theme.id));

  if (availableThemes.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableThemes.length);
  return availableThemes[randomIndex] ?? null;
}

export function getThemeCount(): number {
  return themes.length;
}

export function getThemeCountByCategory(category: ThemeCategory): number {
  return themes.filter((theme) => theme.category === category).length;
}

// Verify theme count
console.log(`Total themes: ${getThemeCount()}`);
THEME_CATEGORIES.forEach((cat) => {
  console.log(`  ${cat}: ${getThemeCountByCategory(cat)}`);
});
