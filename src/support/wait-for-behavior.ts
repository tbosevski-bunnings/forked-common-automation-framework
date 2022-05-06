import {
  Frame,
  Page
} from "playwright"
import {
  ElementLocator,
  GlobalConfig,
  WaitForTarget,
  WaitForTargetType
} from "../env/global"
import { envNumber } from "../env/parseEnv"
import {logger} from "../logger"

export const enum waitForResult {
  PASS = 1,
  FAIL = 2,
  ELEMENT_NOT_AVAILABLE=3
}

export type waitForResultWithContext = {
  result: waitForResult
  replace?: string
}

export const waitFor = async (
    predicate: () =>
        | waitForResult
        | Promise<waitForResult>
        | waitForResultWithContext
        | Promise<waitForResultWithContext>,
    globalConfig: GlobalConfig,
    options?: {
      timeout?: number
      wait?: number
      target?: WaitForTarget
      type?: WaitForTargetType
      failureMessage?: string
    }
): Promise<void> => {
  const {
    timeout = envNumber('WAITFOR_TIMEOUT'),
    wait = envNumber('WAITFOR_POLL_WAIT'),
    target = '',
    type = '' || "element"
  } = options || {}

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const startDate = new Date()
  let notAvailableContext: string | undefined

  let resultAs = waitForResult.ELEMENT_NOT_AVAILABLE
  while (new Date().getTime() - startDate.getTime() < timeout) {

    const result = await predicate()
    if ((result as waitForResultWithContext).result) {
      notAvailableContext = (result as waitForResultWithContext).replace
      resultAs = (result as waitForResultWithContext).result
    } else {
      resultAs = result as waitForResult
    }

    if (resultAs === waitForResult.PASS) {
      return
    }

    await sleep(wait)
    logger.debug(`Waiting ${wait}ms`)
  }
  const waitForErrorMsg =
      resultAs === waitForResult.ELEMENT_NOT_AVAILABLE
          ? `🧨 Timed out after ${timeout}ms waiting for the ${notAvailableContext || target} ${type} 🧨`
          : options?.failureMessage || 'Test assertion failed'
  throw new Error(waitForErrorMsg)
}

export const waitForSelector = async (
    page: Page,
    elementIdentifier: ElementLocator
): Promise<boolean> => {
  try {
    await page.waitForSelector(elementIdentifier, {
      state: 'visible',
      timeout: envNumber('SELECTOR_TIMEOUT')
    })
    return true
  } catch (e) {
    return false
  }
}

export const waitForSelectorOnPage = async (
    page: Page,
    elementIdentifier: ElementLocator,
    pages: Array<Page>,
    pageIndex: number
): Promise<boolean> => {
  try {
    await pages[pageIndex].waitForSelector(elementIdentifier,{
      state: 'visible',
      timeout: envNumber('SELECTOR_TIMEOUT')
    })
    return true
  } catch (e) {
    return false
  }
}

export const waitForSelectorInIframe = async(
    elementIframe: Frame,
    elementIdentifier: ElementLocator,
): Promise<boolean> => {
  try {
    await elementIframe?.waitForSelector(elementIdentifier, {
      state: 'visible',
      timeout: envNumber('SELECTOR_TIMEOUT')
    })
    return true
  } catch (e) {
    return false
  }

}
