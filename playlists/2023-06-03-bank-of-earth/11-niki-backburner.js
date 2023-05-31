const clips = [
  "She hides under her sheets, presumably to sleep but not feeling sleepy at all.",
  "She eats an ice cream cone, but in a self-conscious way, she's on camera after all.",
  "She sprints across the street, ice cream cone in hand.",
  "She struts down the street, ice cream cone in hand.",
  "Sitting in her car, she waves and then converts that wave into a cheeky flip of a middle finger.",
  "With the camcorder zoomed in all the way, her eyes are made huge, filling the frame.",
  "On a beach at sunset, she almost arrived too late and shuffle-runs towards the water.",
  "She stands motionless at the threshold of the ocean.",
  'Standing by the ocean, she breaks a reverie with a suddent flamboyant "whee!"',
  "She examines a dress at the thrift shop, holding it up for appraisal.",
  "At the museum of natural history, with some trickery of the perspective, she inserts herself into T-rex's jaws, wiggling like helpless prey.",
  "Nestled in the corner of a tapas joint, she slumps over a menu.",
  "She rocks out with an wacky inflatable arm flailing tube man.",
  "She attempts to smack the face of a wacky inflatable arm flailing tube man, but he's a bit too big and flails away.",
  "A spot of clouds impinge on otherwise blue skies.",
  "She waves a theatrical and mocking goodbye as she slowly descends an escalator, leaving the cameraman behind.",
  'In a mall she gestures a "get over here" to the cameraman, who is looking down at her from a floor up.',
  "With skepticism she takes a bite of a free sample at the mall, something toasy and fried, like a donut.",
  "Her eyes light up as the jolt of sugar from a donut courses through her veins.",
  "She lights up a cigarette, immediately choking aggressively, tongue poking out in a retch. She definitely never smoked before. She snuffs it out.",
  "The cameraman zooms out to take in her whole look, she looks amazing today.",
  "She does a fascinating little dance where she steps left and right on her toes and heels in such a way that her body doesn't move up and down at all. It is accompanied by a suitably cheeky smile.",
  "She struts obnoxiously down the street like she owns the whole damn town.",
  "She stops to take a generous glup from a green smoothie.",
  "She smiles a nightmarish smile, allowing brown goop, something she's eating, to poke through her teeth.",
  "She drives down the street, sweeping her hair over her shoulder.",
  "She pushes a shopping cart through a department store. With the camera situated on the cart, she rolls, gaining the ability, apparently, to levitate.",
  "She drives past a blazing sunset, glancing towards the overpowering light.",
  "She got caught with a tiny dot of lipstick on her front tooth.",
  "She uses a coin to scratch out numbers on a lottery card. She loses everything.",
  "She takes a kung-fu stance, ready for battle.",
  "In an outburst of silliness, she runs up to hug a support column in some big building, her phone flying quite unintentionally out of her hand, her misfortune a case-study in spectacular comedic timing.",
  "In an art studio she puts the finishing touch of paint on a primitive cartoony man. She points accusatively towards the cameraman.",
  "An RC car zooms an orbit around her, dirt flying in all directions.",
  "Under a tree in a big park, she laughs with a clap of the hands.",
  "She sits at a park bench, studiously sticking owl stickers all over her face.",
  "Her face is completely covered in owl stickers.",
  'She sits cross-legged in the middle of the street, somewhere in suburbia, gesturing like a kung fu artist, "Come closer, I dare you."',
  "She sits in the middle of the street, using her hands like an anime character to launch an energetic blast of pure fury.",
  "Interrupted in the bathroom, she attempts to finish applying her mascara.",
  "She slaps her body against a chain-link fence, converting it into a trampoline.",
  "She sits in the passenger seat of a car, using her phone as they drive down the highway at night.",
  "With glamourous dress, she drives somewhere, looking up with the anxious face of someone who is about to be late.",
  "She runs towards the ocean.",
  'She holds up a t-shirt which is very much worse-for-wear, referring to a "Sadness Tour."',
  "In a parking lot a night, in a stylish overcoat, she stops to pose for some flash photography.",
  "Despite being in an unassuming city park, she brandishes a scowl fit for a jungle guide, holding up a tree's prickly vine as if to demonstrate the many ways the jungle can kill you.",
  "She trespasses in a huge concrete drainage channel.",
  "She smiles and holds her face contentedly.",
  "She poses in a big empty garage, preparing perhaps to claim the space for her kingdom.",
  "She opens a cabinet in the frozen-food section of the supermarket, reflecting a store full of goods in the glass.",
  "A street light produces a dramatic silhouette, like the stage performer she is.",
  "She swipes her paw at the camera, trying to block the recording.",
  "Doggies roam around the living room.",
  "She swipes a right hook at a parking lot mirror.",
  "She bumps a hedge.",
  "She tosses a jacket towards the sky.",
  "She attempts to squeeze the life out of something.",
  "She makes a dab, a dance move that attained meme status for how silly it looks, involving throwing the head into the crook of the arm.",
  "She stands distractedly as the cameraman zeros in on a full moon.",
  "She fills her gas tank.",
  "She giggles like someone just said a sick burn.",
  "She gets mauled by a stuffed bear.",
  "She laughs next to the roses.",
  "She confuses a little pink flower for an earring.",
  "A little pink flower is squeezed on her ear as an earring.",
  "She shoots a jet of water out of her mouth, well, it looks that way thanks to trickery of the perspective. The source of water is actually a water fountain in the distance.",
  "She rips aggressively into a piece of meat in her sandwich.",
  "She runs towards the cameraman.",
  "She sits morosely at home.",
  "She is seated on a big concrete slope, playing games with her phone's flashlight.",
  "On a huge concrete drainage tunnel, she has a big ball of light for a head, thanks to some creative use of her phone's flashlight.",
  "Wind whips her sundress on the beach.",
  "She does a little spin at the mall.",
  "She uses the pressure washer on the car, flinching a bit from the backsplash.",
  "She tosses a jacket towards the camera.",
  "She is taking a challenging phone call.",
  "She plays the game where you stab something between each of your fingers without hitting your fingers. She must have failed because the next shot shows a bloody finger.",
  "She lays down the freaking law at the karaoke club.",
  'She pops into a room, under balloons in the shape of letters which read, "Happy Birthday"',
  "She brances herself as balloons and silly string from a surprise birthday party fly everywhere.",
  "She bawls on her couch.",
  "She giggles on her couch.",
  "She gives two big thumbs up.",
  "She puts on her spa mask, trying not to smile.",
  "She relaxes on her back with her spa mask on.",
  "She laughs at some unknown joke.",
  "She holds up a cutting board with a stack of pieces of bread balanced on top. And then she squishes her whole face into the damn bread.",
  "She engages the stove, gives the cameraman a confident look.",
  "She chases a pigeon, which takes flight.",
]

const sampleClips = () => {
  const openings = 5
  const characterBudget = 150

  function shufflePreserveIndex(array) {
    array
      .map((text, index) => ({ text, index, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ text, index }) => ({ text, index }))
  }

  const shuffledClips = shufflePreserveIndex()

  const selectedClips = []
  let openingsFilled = 0
  let i = 0

  // TODO: The issue is that doing it this way doesn't make it possible to reorder.

  while (true) {
    const clip = shuffledClips[i]

    let usedCharacters = 0

    while (true) {
      if (usedCharacters + clip.text > characterBudget) {
        break
      }
      if (!selectedClips[openingsFilled]) {
        selectedClips[openingsFilled] = []
      }
      selectedClips[openingsFilled].push(clip)
      usedCharacters += clip.text.length
    }

    openingsFilled += 1
    if (openingsFilled === openings) break

    i += 1
  }

  selectedClips.sort((a, b) => a.index - b.index)

  return selectedClips.map((clip) => clips.text)
}

const sampledClips = sampleClips()

export default {
  descriptions: [
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
      time: 45.365,
      text: sampledClips[0],
    },
    {
      time: 58.256,
      text: sampledClips[1],
    },
    {
      time: 69.398,
      text: sampledClips[2],
    },
    {
      time: 78.38,
      text: sampledClips[3],
    },
    {
      time: 96.541,
      text: sampledClips[4],
      // text: "A doggo waddles around the room. In a parking garage she throws a punch at her own reflection. She makes a dab, a dance move that attained meme status for how silly it looks, involving throwing the head into the crook of the arm.",
    },
    {
      time: 253.958,
      text: "Back in her room, she catches her breath, walks to the kitchen and makes herself a cup of tea.",
    },
    {
      time: 273.67,
      text: "Every time you listen to this audio description you will hear different moments described. Every single clip is present, and each has an equal chance to appear.",
    },
  ],
}
