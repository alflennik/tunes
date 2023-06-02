const clips = [
  "She hides under her sheets, presumably to sleep but not feeling sleepy at all.",
  "She digs into some gelato.",
  "She polishes off an ice cream cone, struggling to look elegant as she takes a mighty bite.",
  "She sprints across the street, ice cream cone in hand.",
  "She saunters down the street, careful not to unbalance the ice cream cone in her hand.",
  "Sitting in her car, she waves and then converts that wave into a cheeky flip of a middle finger.",
  "The cameraman squishes the camera as close to her face as possible, her eye taking on epic proportions.",
  "On a beach at sunset, she almost arrived too late and shuffle-runs towards the water.",
  "She stands motionless at the threshold of the ocean.",
  'Standing by the ocean, she breaks a reverie with a suddent flamboyant "whee!"',
  "She examines a dress at the thrift shop, holding it up for approval.",
  "At the museum of natural history, with some trickery of the perspective, she inserts herself into T-rex's jaws, wiggling like helpless prey.",
  "Nestled in the corner of a tapas joint, she slumps over a menu.",
  "She rocks out with a wacky inflatable arm flailing tube man.",
  "She attempts to smack the face of a wacky inflatable arm flailing tube man, but he's a bit too big and flails away.",
  "A spot of clouds impinge on otherwise blue skies.",
  "She waves a theatrical and mocking goodbye as she slowly descends an escalator, leaving the cameraman behind.",
  'In a mall she gestures a "get over here" to the cameraman, who is looking down at her from the balcony a floor up.',
  "With skepticism she takes a bite of a free sample at the mall, something toasy and fried, like a donut.",
  "Her eyes light up as the jolt of sugar from a donut courses through her veins.",
  "She lights up a cigarette, immediately choking aggressively, tongue poking out in a retch. She definitely never smoked before. She snuffs it out.",
  "The cameraman steps back to take in her whole look, she looks amazing today.",
  "She does a fascinating little dance where she steps left and right on her toes and heels in such a way that her body doesn't move up and down at all, while moving aggressively side to side. It is accompanied by a suitably cheeky smile.",
  "She struts obnoxiously down the street like she owns the whole damn town.",
  "Everything is on hold until she gulps her green smoothie.",
  "She smiles a nightmarish smile, allowing brown goop, something she's eating, to poke through her teeth.",
  "The cameraman examines her profile as she focuses on the drive back home.",
  "She pushes a shopping cart through a department store. With the camera situated on the cart, she pushes off and jumps on, gaining the ability, apparently, to levitate.",
  "She's driving and almost ready to park, judging by the blazing sunset and hint of beach outside her car.",
  "She got caught with a tiny dot of lipstick on her front tooth.",
  "She uses a coin to scratch out numbers on a lottery card, and she loses everything.",
  "She takes a kung-fu stance, ready for battle.",
  "In an outburst of silliness, she runs up to hug a support column in some big building, her phone flying quite unintentionally out of her hand, her misfortune a case-study in spectacular comedic timing.",
  "In an art studio she puts the finishing touch of paint on a primitive cartoony man. She points accusatively towards the cameraman.",
  "An RC car zooms an orbit around her, dirt flying in all directions.",
  "Something funny at the park, she snorts and claps her hands.",
  "She sits at a park bench, studiously sticking owl stickers all over her face.",
  "Her face is completely covered in owl stickers.",
  'She sits cross-legged in the middle of the street, somewhere in suburbia, gesturing like a kung fu artist, "Come closer, I dare you."',
  "She sits in the middle of the street, using her hands like an anime character to launch an energetic blast of pure fury.",
  "Interrupted in the bathroom, she attempts to finish applying her mascara.",
  "She slaps her body against a chain-link fence, converting it into a trampoline.",
  "She sits in the passenger seat of a car, using her phone as someone drives her down the highway at night.",
  "Dressed glamourously, she drives somewhere, with the anxious tells of someone who is about to be late.",
  "She ambles towards the cusp of the ocean.",
  'She holds up a holey t-shirt which is very worse-for-wear, on it are the words "Sadness Tour."',
  "In a stylish overcoat, she stops to pose for a camera flash.",
  "Despite being in an unassuming city park, she brandishes a scowl fit for a jungle guide, holding up a tree's prickly vine as if to demonstrate the many ways the jungle can kill you.",
  "She trespasses in a huge concrete drainage channel.",
  "She smiles and holds her face contentedly, like a happy little girl.",
  "She poses in a big empty garage, preparing perhaps to claim the space as her own.",
  "The cameraman dutifully documents her extraction of a drink from a cabinet at the grocery store.",
  "A street light produces a dramatic silhouette, like the stage performer she is.",
  'She swipes her paw at the camera, like "Stop the recording!"',
  "Doggies roam around the living room.",
  "She swipes a right hook at a parking lot mirror.",
  "She boops a hedge.",
  "She tosses a jacket towards the sky.",
  "She attempts to squeeze the life out of something that the cameraman doesn't quite catch.",
  "She does a dab, a dance move famous for looking silly, involving throwing the head into the crook of the arm.",
  "She stands distractedly as the cameraman zeros in on a full moon.",
  "She's just filling her gas tank but the camerman feels this is important.",
  "She giggles like someone just said a sick burn.",
  "She gets mauled by a stuffed bear.",
  "The cameraman makes her laugh next to roses.",
  "She confuses a little pink flower for an earring.",
  "A little pink flower is squeezed behind her ear as an earring.",
  "She shoots a voluminous jet of water right out of her mouth. Well, it looks that way thanks to some perspective trickery. There's a water fountain in the distance.",
  "She rips aggressively into a piece of meat in her sandwich.",
  "She hops up to the cameraman who is waiting by the car.",
  "Poorly lit at home, she looks morose but puts on a grin for the audience.",
  "She is seated on a big concrete slope, playing games with her phone's flashlight.",
  "On a huge concrete drainage tunnel, she has a big ball of light for a head, thanks to some creative use of her phone's flashlight.",
  "Wind whips her sundress on the beach.",
  "She does a little spin at the mall.",
  "She uses the pressure washer on the car, flinching a bit from the backsplash.",
  "She tosses a jacket towards the camera.",
  "She takes a challenging phone call, the cameraman not flinching away.",
  "She plays the game where you tap a pen rapidly between each of your fingers. She fails, and moments later sports a surprisingly bloody finger.",
  "She lays down the freaking law at the karaoke club.",
  'She pops into a room, under balloons in the shape of letters which read, "Happy Birthday"',
  "She braces herself as balloons and silly string from a surprise birthday party fly everywhere.",
  "She bawls on her couch, surrounded by friends who laughing at her and trying to cheer her up.",
  "She giggles on her couch.",
  "She gives two big thumbs up.",
  "She puts on her spa mask, trying not to smile because you're not supposed to move your face when you have one of those things on.",
  "She relaxes on her back with her spa mask on.",
  "She laughs pretentiously at the cameraman's joke.",
  "She holds up a cutting board with a stack of pieces of bread balanced on top. And then she squishes her whole face into the damn bread.",
  "She engages the stove, gives the cameraman a confident look.",
  "She chases a pigeon, forces it to employ its ability of flight.",
  "She dispenses with all appearances and channels the energy of a troll, in order to win at an arcade game, however she only gets second place.",
  "She collapses into groggy drunken sleep at the karaoke club as singing continues behind her.",
  "The cameraman tries to film her sleeping at the food court, but she's too on her game and notices the double-crosser.",
  "Watching a movie, she's drifted out of the story and gotten caught up in stormy trains of thought.",
  "Out in the backyard patio, she mischievously grabs not one, but four Pocky sticks.",
  "She ruinously has taken four Pocky sticks and stands on the cusp of jamming them up her nose.",
  "She rustles with something under her shirt - it's two sharpied-on eyeballs above her belly button. The makeshift face gives the impression of mild shock. She takes it to the bathroom mirror and giggles like a fiend.",
  "Her face flashes with enough strobe lights for the red carpet, but she's just out alone in a parking lot.",
  "She pounds her feet down the sidewalk, no humor, looking at the cameraman like he just made her cry.",
  "Camcorders struggle in extreme environments, and the sun easily overpowers a leafy branch, blowing it out into a lavender wash of rainbow colors.",
  "She lays down deep on the couch, pillows and blankets everywhere, noodling around on her guitar.",
  "She studies from a textbook and really doesn't appreciate the cameraman's interruption.",
  "She rattles the barricade of a music venue already closed for the night.",
  "From the drivers seat of her parked car, she braces as some commotion threatens to intrude.",
  "The cameraman, filming from the passenger seat, captures nothing more than her lunge toward the camcorder followed by some climactic shaking.",
  "She slips and slides on the freshly mopped kitchen floor, attempting to turn it into a dance like Tom Cruise did in one of his first movies.",
  "She grimaces with a 90% ugly face, tempered by 10% self-consciousness.",
  "She is trying to concentrate on whether her pot of food is ready and this is really not a good time to be on camera.",
  "She stands next to a firepit, the flame transfixing her.",
  "Next to a firepit, she hurls a log towards it with maximum force, sparks flying everywhere.",
  "She spits out her drink as if someone just let loose a shocking revelation. Yes, the patio got completely splattered.",
  "Leaning against the foot of the living room couch, she has studio headphones on, laptop open and ready, and she strums on her guitar and sings. Incredibly, it actually looks like she is singing this song.",
  "She sneaks around the university library, peeks at a textbook, spins and duck walks between the stacks.",
  "She goes for the cameraman because it's not a good time.",
  "She puts the bathroom door between her and the cameraman.",
  "In her kitchen, she attempts a smile, but her face is still puffy from tears. And she still hasn't finished cutting the onions.",
  "Like an expert bartender, she slides a soda can towards the edge of her kitchen table, however it flies right off the edge. A few tries later, it stops perfectly at the edge. She is astonished at this achievement.",
  "In full glamorous makeup, she tries to sleep on a park bench, using a designer bag as a pillow and a leather jacket as a blanket.",
  "She tries to find out how many Peeps can fit in her mouth, Peeps being a squishy bunny-shaped food that really stretches the concept of what should be considered food.",
  "She tries to quickly touch the stove flame, and you know what happens, she burns her hand is what happens. She's a little embarrased, like, what did you think would happen?",
  "It's not clear where she is, maybe on the couch in her house, but what is clear is that she's miserable.",
  "She positions her face behind a warning light as if to bleep out a torrent of foul language.",
  "She wields a traffic cone like a giant telescope.",
  "The cameraman succeeds in getting nothing more than an incredulous reaction to his interruption.",
  "She dances along with Disney's Elsa and Anna on the TV.",
  "Not sure what else to do, she tries to do the most famous disco dance move, bringing the finger down to her opposite hip and then up towards the sky.",
  "She spins around laughing outside.",
  "She slaps her own face, and it doesn't look like a joke.",
  "She looks at the cameraman with an expression like disgust, or maybe a plea for help.",
  "Laying down on the couch, tired and bored, she points a strobe light at her own face.",
  "Laying down on top of a picnic blanket in the park, she has a jacket covering her eyes, and also she has a middle finger ready for the cameraman.",
  "Hurriedly proceeding down a hallway, she holds up five fingers to stop the cameraman.",
  "She dances frantically using suburban street lights as stage lights.",
  "On a bus heading somewhere, she is disappointed.",
  "She is massively underwhelmed at the pajama shop.",
  "The camcorder skids around the pavement at a parking lot, finally coming to a standstill with a view of nothing more than her skinny legs.",
  "Skinning a carrot, she recoils her hand from an apparent injury.",
  "Seagulls fly past at sunset.",
  "She lays down on top of the roof of a house, her calves gripping onto the triangular peak.",
  "She eats candies on the couch, but an intricate LEGO treehouse behind her steals the spotlight.",
  "She attempts to film herself but ends up with little more than a sloppy blurry mess.",
  "Surrounded by highly developed cityscape, her brow is furrowed as she appraises her options.",
  "She looks up at a passing leerjet, the kind corporate executives use. Also, she has a roller suitcase with her.",
  "She looks embarrassed as she carries an impressively ornate birthday cake out to the patio. She blows out the candles.",
  "In the bathroom mirror, she films herself filming herself, an infinity mirror forming in the camcorder display.",
  "She pages through a high school yearbook.",
  "She takes a flattened cutout of a leaf and inserts it into the mouth of a flattened cutout of a dinosaur.",
  "In the park she seemingly decries the damn whipper-snappers who won't get off the lawn.",
  "She burns something, holding it carefully at arms length, maybe it's a piece of paper.",
  "Her face is almost impossible to see, thanks to the contrast from a bright light in the background, but there is a hint of an interesting intensity in her face.",
  "At the gas station, she walks back to her car, not at all aware that she is too cool for such an ordinary environment.",
  "In the kitchen, she duels the cameraman, two butcher knives flailing a bit more than is probably safe.",
  "She bows down in reverance to a great big wacky flailing arm inflatable tube man.",
  "Her sunglasses reflect what she sees, which is idyllic palm trees and ocean at sunset.",
  "She hangs sideways from a pole and the cameraman rotates the camera, so it's the world which is askew.",
  "Tragically, she dropped a tray of french fries onto the concrete.",
  "She laughs in the passenger seat.",
  "Stopped at a red light, she makes a little tube with her hand in order to direct the camera's gaze towards the sunset.",
  "The cameraman examines her hair clip which is in the shape of a little yippy doggy.",
  "With a smile, she looks not at the camcorder, but behind it, at whoever is on the other side.",
  "She smiles like a movie star under strobing lights which look like flashing photos.",
  "She sticks out her tongue.",
  "She blows some bubbles.",
  "She takes advantage of some empty bleachers at a park to sit down and sip from her green smoothie.",
  "She spins around haphazardly.",
  "Next to a row of palm trees, she leaps upwards, but she can't quite reach their level.",
  "A few balloons are sitting in the middle of a busy road, and she rockets in at a full sprint, inexplicably, to kick them.",
  "Dressed glamorously, she walks hurriedly towards some opportunity.",
  "At a botanical garden, there is a strange bush which has a bunch of twiggy red branches but no leaves. Anyway she has stuck two twigs in each of her nostrils.",
  "At a department store, she has an absolutely enormous head, or at least that what it looks like becaues she's standing directly behind a little kid-sized mannequin.",
  "Her attempt to sit on a little-kid sized chair fails and she tumbles into the grass.",
  "Like a kung-fu master she wall jumps off a sloping concrete wall.",
  "She teases the camera with a flaming twig from the fire pit.",
  "A jumbo jet passes by overhead on its way to land.",
  "She has a new fashion accessory, a sandcastle bucket, worn as a helmet.",
  "She makes a shadow puppet with her hands, putting her fingers in careful shapes to produce a shadow which cleanly resembles the shape of a bird.",
  "She wears glamorous makeup and a floral dress which seems out of place in a big empty parking garage.",
  "In a parking garage, she walks towards her car.",
  "In her bedroom, she looks faded and exhausted.",
  "Water makes funny ripping shapes as it flows.",
  "She focuses on driving, navigating through a tunnel.",
  "A scoop of ice cream, unfortunately, has splattered on the floor.",
  "She holds up a one on both fingers, and then like pregnancy, she slaps her fingers together, and then has a one on one finger and a two on the other.",
  "She looks amused at the basketball machine at the arcade.",
  "With no regard for ladylike appearances, she squishes her whole damn face against her car's windshield, producing a horribly unflattering portrait of a strange kind of confidence.",
  "Somewhere at home she slaps her hands together to emphasize a point.",
  "Hopping in her car, she gives the cameraman an exceeding dose of skepticism.",
  "She flops herself down like a dead person over the side of her couch.",
  "At a city park, she stops in the shade to take a sip from her bubble tea.",
  "The nighttime wind wafts over her hair.",
  "She takes a lighter to a bit of leather for an unknown purpose.",
  "Sunglasses on, she stands in front of a giant size pair of sunglasses.",
  "Complete devoid of logic, the cameraman has placed a doll face near the camera, and she sticks her tongue out like she's about to launch into a lewd makeout scene.",
  "Looking drained, she shakes her head and rubs her eyes.",
  "She stands on a suburban road, looking up as the cameraman shines a spotlight her way.",
  "She smiles as she plays back a music recording on her studio headphones.",
  "In the bathroom she is looking downward, perhaps to put toothpaste on her toothbrush.",
  "She attempts to climb a tree like a monkey, getting really no further than she would be if she just stood on the ground.",
  "Tourists crowding all around, she walks through a food court.",
  "She takes a big jaunty step down her suburban street.",
  "Wearing a spa mask, she keeps her face studiously devoid of emotion, as an expression would reduce its effectiveness.",
  "At a university, she drops a knee, either to lunge for exercise or perhaps to copy the NFL athletes who take a knee in protest.",
  "She wears extra powerful sunglasses and then looks directly into the sun.",
  "She drives her car, angling for a parking spot right over there.",
  "She waves the cameraman away, she's got nothing more to offer.",
  "She smiles uncertainly as if someone just told her she's pretty.",
  "She rides a rental scooter at low speed for practice in an enclosed parking lot.",
  "She flashes a smile despite the fact the wind has totally messed up her hair.",
  "A cute little doggo walzes onto her picnic blanket.",
  "A giraffe sculpture doesn't looks silly at all, until of course she copies its expression but in the worst possible way.",
  "She glowers in no particular direction.",
  "She runs in slow mo like an action hero down her suburban street.",
  "She presents the most dogged and resolute side of herself.",
  "Like a wild person, she cackles excitedly as she leans over some small object on the pavement.",
  "She sweeps her broom across her kitchen floor.",
  "She holds up a phone with eyes on it over her real eyes.",
  "The cameraman's hand reaches into frame to grab some french fries.",
  "Out in the park, she attempts to use a twig as a magic wand.",
  "She presents her tongue, which is blue probably from some ultra-processed food.",
  "With full glamorous dress she twirls around, not in a ballroom but in a parking garage.",
  "In her pajamas, she flips her hair over the front of her face, presumably to run the hair dryer.",
  "She runs helter skelter down the beach.",
  'She shrugs, like "Sorry bro."',
  "Bundled up under her hoodie, she uses the camcorder's digital eye to size herself up.",
  "Famously, the full moon is almost impossible to capture on camera, and this clip is no exception, it's blurry and lacks any detail.",
  "The cameraman sneaks up behind her, looks over her shoulder in an attempt to read the message she's typing on her phone.",
  "Walking up to her car, the cameraman captures her attention, and she violently gestures for him to get his goddamn ass in the car right now.",
]

const sampleClips = () => {
  const openingCount = 13
  const characterMinimum = 100
  const characterMaximum = 250
  const characterMagicNumber = 180
  const overallCharacterBudget = openingCount * characterMagicNumber

  const shufflePreserveIndex = (array) => {
    return array
      .map((text, index) => ({ text, index, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ text, index }) => ({ text, index }))
  }

  const shuffledClips = shufflePreserveIndex(clips)

  const selectedClips = []

  let usedCharacters = 0
  let i = 0

  while (true) {
    const clip = shuffledClips[i]

    if (usedCharacters + clip.text.length > overallCharacterBudget) {
      break
    }
    selectedClips.push(clip)
    usedCharacters += clip.text.length

    i += 1
  }

  selectedClips.sort((a, b) => a.index - b.index)

  const openings = []

  i = 0
  selectedClips.forEach((clip) => {
    const currentCount = openings[i]?.join(" ").length ?? 0
    if (currentCount > characterMinimum || currentCount + clip.text.length > characterMaximum) {
      i += 1
      openings[i] = [clip.text]
      return
    }
    if (!openings[i]) {
      openings[i] = []
    }
    openings[i].push(clip.text)
  })

  console.log(openings.length)
  const extraItems = openings.length - 1 - openingCount
  for (let i = 0; i < extraItems; i += 1) {
    // remove random item
    openings.splice(Math.floor(Math.random() * openings.length), 1)
  }

  return openings.map((clips) => clips.join(" "))
}

export default {
  get descriptions() {
    const sampledClips = sampleClips()
    return [
      {
        time: 0.663,
        text: "The artist NIKI hops onto her bed and plugs a camcorder into her laptop.",
      },
      {
        time: 10.645,
        text: "A smile appears as the footage starts to play back.",
      },
      {
        time: 33.914,
        text: "It's just a series of moments from her life. None of them more than a couple of seconds.",
      },
      {
        time: 40.042,
        text: sampledClips[0],
      },
      {
        time: 54.256,
        text: sampledClips[1],
      },
      {
        time: 69.398,
        text: sampledClips[2],
      },
      {
        time: 86.64,
        text: sampledClips[3],
      },
      {
        time: 99.131,
        text: sampledClips[4],
      },
      {
        time: 115.007,
        text: sampledClips[5],
      },
      {
        time: 127.721,
        text: sampledClips[6],
      },
      {
        time: 150.121,
        text: sampledClips[7],
      },
      {
        time: 172.321,
        text: sampledClips[8],
      },
      {
        time: 183.803,
        text: sampledClips[9],
      },
      {
        time: 203.151,
        text: sampledClips[10],
      },
      {
        time: 216.021,
        text: sampledClips[11],
      },
      {
        time: 227.619,
        text: sampledClips[12],
      },
      {
        time: 236.646,
        text: sampledClips[13],
      },
      {
        time: 253.958,
        text: "Back in her room, having finished watching the footage, she catches her breath, walks to the kitchen and makes herself a cup of tea.",
      },
      {
        time: 271.003,
        text: "Every time you listen to this audio description you will hear different moments described. Every single clip is present, and each has an equal chance to appear.",
      },
    ]
  },
  analysis: {
    text: "Analysis: The word backburner seems quite clearly to refer to a kind of love where someone isn't consistently there. Our lives are full of waiting for something that might or might not happen, and it's the wait ultimately that we're left with.",
  },
}
