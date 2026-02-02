/* eslint-disable */
/* oxlint-disable */
// @ts-nocheck

// This script is served by Pleye, on /reporter.js of your instance.
// Pleye version branch list status icons

import { createHash } from "node:crypto"
import * as path from "node:path"
import { readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"

/**
 * @import { Inputs } from '../routes/update/[repository=integer]/inputs';
 * @import * as PW from '@playwright/test/reporter';
 * @typedef {Inputs['begin']['run']} RunData
 */

/**
 * @typedef {object} PleyeParams
 * @property {string} apiKey API Key to use
 * @property {string} serverOrigin Origin of the Pleye server, e.g. https://pleye.example.com
 * @property {number} githubJobId ID of the current GitHub job we're on, ${{ github.job.check_run_id }}
 * @property {string} commitSha Current commit SHA
 * @property {number | undefined} [pullRequestNumber] Current pull request number, if applicable
 * @property {(sha1: string, extension: `.${string}`) => URL | null} traceViewerUrl Function that generates a trace viewer URL given a trace attachment's  SHA1 content hash and its file extension. For example, for Playwright's HTML reporter, traces are at `/data/${sha1}${extension}`
 * @property {string} [baseDirectory] Absolute directory to the root of the repository, used to relativize file paths. Defaults to $GITHUB_WORKSPACE
 * @property {boolean} [debug] Whether to enable debug logging
 */

/**
 * Requires the following environment variables to be set:
 * - GITHUB_WORKSPACE
 * - GITHUB_REPOSITORY
 * - GITHUB_RUN_ID
 * - GITHUB_JOB
 * - GITHUB_HEAD_REF or GITHUB_REF_NAME
 * - GITHUB_WORKFLOW
 * - GITHUB_REPOSITORY
 * - GITHUB_REPOSITORY_ID
 * - GH_TOKEN
 * And the following binaries to be available in PATH:
 * - git
 * - gh (GitHub CLI)
 * @implements {PW.Reporter}
 */
export default class Pleye {
  /** @type {string} */
  #apiKey
  /** @type {string} */
  #serverOrigin
  /** @type {number} */
  #repositoryGitHubId
  /** @type {RunData} */
  #runData
  /** @type {boolean} */
  #debugging
  /** @type {string} */
  #baseDirectory
  /** @type {PleyeParams['traceViewerUrl']} */
  #traceViewerUrl

  /** @type {number} */
  #expectedTestsCount = 0

  /**
   * Stores the current step index for each test.
   * Test are keyed by a JSON stringified version of their TestIdentifierParams.
   * @type {Map<string, number>}
   */
  #stepIndices = new Map()

  /**
   *
   * @param {PleyeParams} params
   */
  constructor(params) {
    const {
      apiKey,
      serverOrigin,
      debug,
      baseDirectory,
      traceViewerUrl,
      commitSha,
      githubJobId,
      pullRequestNumber,
    } = params

    this.#apiKey = apiKey
    this.#serverOrigin = serverOrigin
    this.#repositoryGitHubId = Number(process.env.GITHUB_REPOSITORY_ID)
    this.#debugging = debug ?? false
    this.#baseDirectory =
      baseDirectory ?? process.env.GITHUB_WORKSPACE ?? process.cwd()
    this.#traceViewerUrl = traceViewerUrl ?? (() => null)

    const repository = process.env.GITHUB_REPOSITORY

    if (!repository) {
      throw new Error("GITHUB_REPOSITORY environment variable is not set")
    }

    this.#debug(`Getting commit data for ${commitSha}`)

    const [
      commitTitle,
      commitDate,
      authorName,
      authorEmail,
      ...commitDescription
    ] = this.#run(
      "git",
      "log",
      "-1",
      "--pretty=" + ["%s", "%cI", "%an", "%ae", "%b"].join("%n"),
      commitSha,
    ).split("\n")

    this.#debug(`Got commit details`, {
      commitTitle,
      commitDate,
      authorName,
      authorEmail,
      commitDescription,
    })

    const githubRunId = Number(process.env.GITHUB_RUN_ID)

    this.#debug(
      `Run ID is ${githubRunId}: https://github.com/${repository}/actions/runs/${githubRunId}`,
    )

    this.#debug(`Getting job name for job ID ${githubJobId}`)

    const jobName = this.#run(
      "gh",
      "run",
      "view",
      githubRunId.toString(),
      "--json",
      "jobs",
      "--jq",
      `.jobs[] | select(.databaseId == ${githubJobId}).name`,
    )

    this.#debug(`Job name is "${jobName}"`)

    this.#debug(`Getting commit author username for commit ${commitSha}`)

    const commitUsername = this.#run(
      "gh",
      "api",
      `/repos/${repository}/commits/${commitSha}`,
      "--jq",
      ".author.login",
    )

    this.#debug(`Commit author username is "${commitUsername}"`)

    let pullRequestTitle = ""

    if (pullRequestNumber) {
      this.#debug("Maybe getting pull request title for PR", pullRequestNumber)

      pullRequestTitle = this.#run(
        "gh",
        "pr",
        "view",
        pullRequestNumber.toString(),
        "--json",
        "title",
        "--jq",
        ".title",
      )

      this.#debug(`Pull request title is "${pullRequestTitle}"`)
    }

    const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME
    if (!branch) {
      throw new Error(
        "Could not determine branch name from GITHUB_HEAD_REF or GITHUB_REF_NAME",
      )
    }

    this.#runData = {
      startedAt: new Date(),
      githubJobId,
      githubJobName: jobName,
      githubRunId,
      githubRunName: process.env.GITHUB_WORKFLOW || "",
      commitSha,
      commitTitle,
      commitDescription: commitDescription.join("\n"),
      commitAuthorName: authorName,
      commitAuthorEmail: authorEmail,
      commitAuthorUsername: commitUsername,
      committedAt: new Date(commitDate),
      branch,
      pullRequestNumber,
      pullRequestTitle,
    }

    this.#debug("Will start run with data", this.#runData)
  }

  /**
   *
   * @param {PW.FullConfig} config
   * @param {PW.Suite} suite
   */
  onBegin(config, suite) {
    this.#expectedTestsCount = suite.allTests().length

    void this.#sendPayload("begin", {
      run: {
        ...this.#runData,
        baseDirectory: this.#baseDirectory,
        testrunsCount: this.#expectedTestsCount,
      },
      projects: config.projects.map((project) => ({
        name: project.name,
        match: toArray(project.testMatch).map(String),
        ignore: toArray(project.testIgnore).map(String),
        timeoutMs: project.timeout,
      })),
    })
  }

  /**
   * @param {PW.FullResult} result
   */
  onEnd(result) {
    void this.#sendPayload("end", {
      status: "completed",
      completedAt: new Date(),
      result: result.status,
      githubJobId: this.#runData.githubJobId,
    })
  }

  // TODO: onError, onExit

  /**
   *
   * @param {PW.TestCase} test
   * @param {PW.TestResult} result
   * @param {PW.TestStep} step
   * @returns
   */
  onStepBegin(test, result, step) {
    // For now, we send both step-begin and step-end at the end of the step to filter out steps that are <1second long, otherwise theres too many requests
  }

  /**
   *
   * @param {PW.TestCase} test
   * @param {PW.TestResult} result
   * @param {PW.TestStep} step
   */
  onStepEnd(test, result, step) {
    const stepIdentifier = this.#stepIdentifierParams(test, result)
    if (!stepIdentifier) return

    if (step.steps.length > 0) {
      // We only care about "true" steps
      return
    }

    const testKey = this.#stepIndicesKey(test)
    const index = (this.#stepIndices.get(testKey) ?? -1) + 1
    this.#stepIndices.set(testKey, index)

    if (step.duration < 1_000) {
      // Ignore steps that are less than 1 second long
      // Index is still incremented above, so that the UI knows that a step happened here
      return
    }

    void (async () => {
      await this.#sendPayload("step-begin", {
        githubJobId: this.#runData.githubJobId,
        test: this.#testIdentifierParams(test),
        step: {
          index,
          retry: result.retry,
          title: step.titlePath().at(-1) ?? "",
          path: step.titlePath().slice(0, -1),

          startedAt: step.startTime,
          annotations: step.annotations,
          category: toStepCategory(step.category),
          filePath: step.location
            ? this.#relativeFilepath(step.location.file)
            : null,
          locationInFile: step.location
            ? [step.location.line, step.location.column]
            : null,
          // TODO: step.parent
          // parentStepId: step.parent
        },
      })

      // Small delay to ensure step-begin is processed before step-end
      await new Promise((resolve) => setTimeout(resolve, 100))

      await this.#sendPayload("step-end", {
        githubJobId: this.#runData.githubJobId,
        step: stepIdentifier,
        duration: toISOInterval(step.duration),
        error: step.error ? this.#toError(step.error) : undefined,
      })
    })()
  }

  /**
   *
   * @param {PW.TestCase} test
   * @param {PW.TestResult} result
   */
  onTestBegin(test, result) {
    const { title, path } = splitTitlePath(test.titlePath())

    const project = test.parent?.project()
    if (!project) {
      return
    }

    this.#stepIndices.set(this.#stepIndicesKey(test), -1)
    if (this.#debugging)
      console.info("[Pleye] onTestBegin, stepIndices are", this.#stepIndices)

    void this.#sendPayload("test-begin", {
      githubJobId: this.#runData.githubJobId,
      projectName: project.name,
      testrunsCount: this.#expectedTestsCount,
      test: {
        title,
        path,
        tags: test.tags,
        filePath: this.#relativeFilepath(test.location.file),
        locationInFile: [test.location.line, test.location.column],
        annotations: test.annotations,
      },
      testrun: {
        timeoutMs: test.timeout,
        expectedStatus: test.expectedStatus,
        retriesLimit: test.retries,
        retries: result.retry,
        startedAt: result.startTime,
      },
    })
  }

  /**
   *
   * @param {PW.TestCase} test
   * @param {PW.TestResult} result
   */
  onTestEnd(test, result) {
    if (this.#debugging)
      console.info("[Pleye] onTestEnd, attachments are", result.attachments)
    if (this.#debugging)
      console.info(
        "[Pleye] onTestEnd, the following trace viewer URLs were derived:",
        result.attachments.map((a) => this.#attachmentTraceViewerURL(a)),
      )

    void this.#sendPayload("test-end", {
      githubJobId: this.#runData.githubJobId,
      test: this.#testIdentifierParams(test),
      outcome: test.outcome(),
      stepsCount: (this.#stepIndices.get(this.#stepIndicesKey(test)) ?? -1) + 1,
      result: {
        duration: toISOInterval(result.duration),
        annotations: result.annotations,
        errors: result.errors.map((e) => this.#toError(e)),
        retry: result.retry,
        startedAt: result.startTime,
        status: result.status,
        stdout: bufferToText(result.stdout),
        stderr: bufferToText(result.stderr),
        traceViewerUrl:
          result.attachments
            .map((attachment) => this.#attachmentTraceViewerURL(attachment))
            .find((url) => url !== null) ?? null,
      },
    })
  }

  /**
   *
   * @template {keyof Inputs} Event
   * @param {Event} event
   * @param {Inputs[Event]} payload
   */
  async #sendPayload(event, payload) {
    return fetch(
      `${this.#serverOrigin}/update/${this.#repositoryGitHubId}/${event}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify(payload),
      },
    ).then(async (res) => {
      if (!this.#debugging) return
      if (res.ok) return
      console.error(
        `Failed to send ${event.toString()} payload:`,
        res.status,
        res.statusText,
        await res.text(),
      )
      console.error("Payload was:", payload)
    })
  }

  /**
   *
   * @param {PW.TestCase} test
   * @param {PW.TestResult} result
   * @returns {import('../routes/update/[repository=integer]/common').StepIdentifierParams | undefined}
   */
  #stepIdentifierParams(test, { retry }) {
    const index = this.#stepIndices.get(this.#stepIndicesKey(test))

    if (index === undefined) {
      console.error(
        "Step index not found for test:",
        test.titlePath().join(" > "),
      )
      console.error("Step indices map is", this.#stepIndices)
      return undefined
    }

    return { index, retry, test: this.#testIdentifierParams(test) }
  }

  /**
   *
   * @param {PW.TestCase} test
   */
  #stepIndicesKey(test) {
    return JSON.stringify(this.#testIdentifierParams(test))
  }

  /**
   *
   * @param {PW.TestCase} test
   * @returns {import('../routes/update/[repository=integer]/common').TestIdentifierParams}
   */
  #testIdentifierParams(test) {
    return {
      filePath: this.#relativeFilepath(test.location.file),
      ...splitTitlePath(test.titlePath()),
    }
  }

  /**
   *
   * @param {PW.TestError} error
   * @returns {NonNullable<Inputs['step-end']['error']>}
   */
  #toError(error) {
    const { location, message, stack, snippet } = climbToCauseError(error)
    return {
      message,
      stack,
      snippet,
      filePath: location?.file ? this.#relativeFilepath(location.file) : null,
      locationInFile: location ? [location.line, location.column] : null,
    }
  }

  /**
   *
   * @param {string} absolutePath
   */
  #relativeFilepath(absolutePath) {
    if (absolutePath.startsWith(this.#baseDirectory)) {
      return absolutePath.slice(this.#baseDirectory.length).replace(/^\/+/, "")
    }

    return absolutePath
  }

  /**
   * @see https://github.com/microsoft/playwright/blob/de8df95e3542bbc83d35e9a96a3edfa684527147/packages/playwright/src/reporters/html.ts#L455
   * @param {PW.TestResult['attachments'][number]} attachment
   * @returns {boolean}
   */
  #attachmentIsTrace(attachment) {
    return attachment.name === "trace"
  }

  /**
   * @see https://github.com/microsoft/playwright/blob/de8df95e3542bbc83d35e9a96a3edfa684527147/packages/playwright/src/reporters/html.ts#L474
   * @param {PW.TestResult['attachments'][number]} attachment
   */
  #attachmentTraceViewerURL(attachment) {
    if (!this.#attachmentIsTrace(attachment)) return null
    if (!attachment.path) return null

    let body = attachment.body
    if (!body) {
      // Read from disk
      body = readFileSync(attachment.path)
    }

    const sha1 = calculateSha1(body)
    const extension = path.extname(attachment.path)

    if (!extension.startsWith(".")) return null

    return this.#traceViewerUrl(sha1, /** @type {`.${string}`} */ (extension))
  }

  /**
   * @param {string} command
   * @param  {...any} args
   */
  #run(command, ...args) {
    this.#debug(`Running command`, command, ...args)
    const cmd = spawnSync(command, args)
    this.#debug({ cmd })
    const [, stdout, stderr] = cmd.output
    this.#debug(`Command stdout:`, stdout?.toString("utf-8"))
    this.#debug(`Command stderr:`, stderr?.toString("utf-8"))
    return stdout?.toString("utf-8").trim() ?? ""
  }

  #debug(...args) {
    if (this.#debugging) {
      console.debug("[Pleye]", ...args)
    }
  }
}

/**
 * @template T
 * @param {T | T[]} item
 * @returns {T[]}
 */
function toArray(item) {
  return Array.isArray(item) ? item : [item]
}

/**
 *
 * @param {string} category
 * @returns {Inputs['step-begin']['step']['category']}
 */
function toStepCategory(category) {
  switch (category) {
    case "expect":
      return "expect"
    case "fixture":
      return "fixture"
    case "hook":
      return "hook"
    case "pw:api":
      return "pw:api"
    case "test.step":
      return "test.step"
    case "test.attach":
      return "test.attach"
    default:
      return "custom"
  }
}

/**
 *
 * @param {number} durationMs
 * @returns {string}
 */
function toISOInterval(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = durationMs % 1000

  return `PT${hours}H${minutes}M${seconds}.${milliseconds.toString().padStart(3, "0")}S`
}

/**
 *
 * @param {Array<string | Buffer>} writes
 * @returns {string}
 */
function bufferToText(writes) {
  return writes
    .map((chunk) => (Buffer.isBuffer(chunk) ? chunk.toString("utf-8") : chunk))
    .join("")
}

/**
 *
 * @param {PW.TestError} error
 * @returns {PW.TestError}
 */
function climbToCauseError(error) {
  if (error.cause) {
    return climbToCauseError(error.cause)
  }

  return error
}

/**
 * @param {string[]} titlePath
 */
function splitTitlePath(titlePath) {
  const [_root, _project, _file, ...fullpath] = titlePath
  return {
    title: fullpath.at(-1) ?? "",
    path: fullpath.slice(0, -1),
  }
}

/**
 *
 * @see https://github.com/microsoft/playwright/blob/de8df95e3542bbc83d35e9a96a3edfa684527147/packages/playwright-core/src/server/utils/crypto.ts#L25-L29
 * @param {Buffer | string} buffer
 * @returns {string}
 */
function calculateSha1(buffer) {
  const hash = createHash("sha1")
  hash.update(buffer)
  return hash.digest("hex")
}
