import axios, { AxiosRequestConfig } from 'axios'
import logger from '@wdio/logger'

import type { TestResults, NewTest, ReporterOptions, TestCase } from './types'

const log = logger('TestrailReporter')

export default class TestRailAPI {
    #config: AxiosRequestConfig = {}
    #projectId: string
    #baseUrl: string
    #includeAll: boolean

    /**
     *
     * @param username username of testrail instance
     * @param password API token
     */
    constructor (options: ReporterOptions) {
        this.#baseUrl = `https://${options.domain}/index.php?/api/v2`
        this.#projectId = options.projectId
        this.#includeAll = options.includeAll
        this.#config.auth = {
            username: options.username,
            password: options.apiToken
        }
    }

    async updateTestRunResults (runId: string, results: TestCase[]) {
        try {
            const resp = await axios.post(
                `${this.#baseUrl}/add_results_for_cases/${runId}`,
                { results },
                this.#config,
            )
            return resp
        } catch (err) {
            log.error(`Failed to update test run results: ${err.message}`)
        }
    }

    async updateTestRun (runId: string, case_ids: unknown[]) {
        await axios.get(
            `${this.#baseUrl}/get_tests/${runId}`,
            this.#config
        ).then((res) => {
            if (res.data.tests.length > 0) {
                const addCaseIds = res.data.tests.map((tests: { case_id: number }) => tests.case_id)
                addCaseIds.forEach((id: number) => {
                    case_ids.push(id)
                })
            }
        }
        ).catch((err) => {
            log.error(`Error getting test run: ${err.message}`)
        })

        try {
            const resp = await axios.post(
                `${this.#baseUrl}/update_run/${runId}`,
                { 'case_ids': case_ids },
                this.#config
            )
            return resp
        } catch (err) {
            log.error(`Failed to update test run: ${err.message}`)
        }
    }

    async pushResults (runId: string, testId: string, results: TestResults) {
        try {
            const resp = axios.post(
                `${this.#baseUrl}/add_result_for_case/${runId}/${testId}`,
                results,
                this.#config,
            )
            return resp
        } catch (err: any) {
            log.error(`Failed to push results: ${err.message}`)
        }
    }

    async getLastTestRun (suiteId: string, runName: string) {
        try {
            const resp = await axios.get(
                `${this.#baseUrl}/get_runs/${this.#projectId}&suite_id=${suiteId}`,
                this.#config
            )
            const thisrun = resp.data.runs.filter(function (run: NewTest) {
                return run.id?.match(runName)
            })

            const runId = thisrun

            return runId
        } catch (err: any) {
            log.error(`Failed to get test run id: ${err.message}`)
        }
    }
}
