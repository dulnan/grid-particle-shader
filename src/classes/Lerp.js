export default class Lerp {
  constructor(amount = 0.5, initial = 0) {
    this.amount = amount

    this.current = initial
    this.target = initial
  }

  setTarget(target) {
    this.target = target
  }

  getValue() {
    return this.current
  }

  step() {
    if (this.current === this.target) {
      return
    }

    const newCurrent =
      (1 - this.amount) * this.current + this.amount * this.target

    if (Math.abs(this.target - newCurrent) < 0.03) {
      this.current = this.target
    }

    this.current = newCurrent
  }

  move(amount) {
    this.target = this.target + amount
  }
}
