import { test, expect } from "@playwright/test";

test.describe("parallel computation", () => {
  // TODO test workerType=service
  for (const workerType of ["shared", "dedicated"]) {
    test.describe(`using a ${workerType} worker`, () => {
      test("completes and uses different nodes", async ({
        page,
        browserName,
      }) => {
        test.fixme(
          browserName === "webkit",
          'For some reason, parallelisation tests are pretty flaky on Webkit, it seems to progress "too soon", we aren\'t able to catch the 0% case',
        );
        await page.goto(`/${workerType}/parallel/?nodes=10`);
        await page.getByRole("spinbutton").first().fill("4");
        expect(page.locator("#result")).toMatchAriaSnapshot(
          results({ finished: false, progress: null, node: "?" }),
        );

        await page.getByRole("button", { name: "Compute" }).click();

        for (const progress of [0, 25, 50, 75, 100]) {
          const nodes = await page
            .locator("#result")
            .allInnerTexts()
            .then((lines) => {
              const all = lines.join(" ");
              const pattern = /from (N[0-9A-F]{3})/g;
              const matches: Set<string> = new Set();
              let result;
              do {
                result = pattern.exec(all);
                if (result) matches.add(result[1]);
              } while (result);

              return matches;
            });
          await expect(page.locator("#result")).toMatchAriaSnapshot(
            results({
              finished: progress === 100,
              progress: [0, 25, 50, 75, 100].filter((p) => p <= progress),
              node: /N[0-9A-F]{3}/,
            }),
            { timeout: 2_000 },
          );

          if (progress > 0) expect(nodes.size).toBe(10);
        }
      });
    });
  }
});

function results({
  finished,
  progress,
  node,
}: {
  finished: boolean;
  progress: number[] | null;
  node: string | RegExp;
}) {
  const regexp = (value: string | RegExp) =>
    typeof value === "string"
      ? RegExp.escape(value)
      : value.toString().replace(/^\/|\/$/g, "");

  const progressPattern =
    progress === null ? "waiting" : progress.map((p) => `${p}%`).join(" | ");

  const result = (index: number) => (finished ? index * 4 : 0);

  return `
          - paragraph:
            - code: /4 · 0 = ${result(1)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 1 = ${result(2)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 2 = ${result(3)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 3 = ${result(4)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 4 = ${result(5)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 5 = ${result(6)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 6 = ${result(7)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 7 = ${result(8)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 8 = ${result(9)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 9 = ${result(1)} ${progressPattern} from ${regexp(node)}/
          - paragraph:
            - code: /4 · 10 = ${result(10)} ${progressPattern} from ${regexp(node)}/
        `;
}
