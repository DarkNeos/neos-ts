import { expect, type Locator } from "@playwright/test";

export async function expectCardFace(card: Locator, faceup: boolean) {
  await expect
    .poll(() =>
      card
        .locator('[class*="img-wrap"]')
        .evaluate(
          (element) => new DOMMatrix(getComputedStyle(element).transform).m33,
        ),
    )
    .toBeCloseTo(faceup ? 1 : -1, 4);
}

export async function expectCardDepth(card: Locator, depth: number) {
  await expect
    .poll(() =>
      card
        .locator('[class*="img-wrap"]')
        .evaluate(
          (element) =>
            new DOMMatrix(getComputedStyle(element).transform).m43 - 0.1,
        ),
    )
    .toBeCloseTo(depth, 4);
}

export async function expectCardHeight(card: Locator, height: number) {
  await expect
    .poll(() =>
      card.evaluate((element) => {
        const style = getComputedStyle(element);
        const transform = new DOMMatrix(style.transform);
        return parseFloat(style.height) * Math.hypot(transform.a, transform.b);
      }),
    )
    .toBeCloseTo(height, 2);
}
