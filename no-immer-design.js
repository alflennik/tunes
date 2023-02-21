class A {
  #mutableState = {
    numbers: {
      normal: [3, 11],
      reversed: [45],
    },
  };

  #immutableState;

  get state() {
    return this.#immutableState;
  }

  constructor() {
    this.#immutableState = { ...this.#mutableState };
    this.#immutableState.numbers = { ...this.#mutableState.numbers };
    this.#immutableState.numbers.normal = [
      ...this.#mutableState.numbers.normal,
    ];
    this.#immutableState.numbers.reversed = [
      ...this.#mutableState.numbers.reversed,
    ];

    Object.freeze(this.#immutableState);
    Object.freeze(this.#immutableState.numbers);
    Object.freeze(this.#immutableState.numbers.normal);
    Object.freeze(this.#immutableState.numbers.reversed);
  }

  triggerStateChange() {
    this.#mutableState.numbers.normal.push(13);

    this.#immutableState = { ...this.#mutableState };
    this.#immutableState.numbers = { ...this.#mutableState.numbers };
    this.#immutableState.numbers.normal = [
      ...this.#mutableState.numbers.normal,
    ];
    this.#immutableState.numbers.reversed = [
      ...this.#mutableState.numbers.reversed,
    ];

    Object.freeze(this.#immutableState);
    Object.freeze(this.#immutableState.numbers);
    Object.freeze(this.#immutableState.numbers.normal);
    Object.freeze(this.#immutableState.numbers.reversed);
  }
}

const a = new A();

console.log(a.state);
// console.log(a.state.numbers.normal.push(99)) // will error
console.log((a.state.letters = ["m"])); // no effect
a.triggerStateChange();
console.log(a.state);
a.state = {}; // no effect
console.log(a.state);
