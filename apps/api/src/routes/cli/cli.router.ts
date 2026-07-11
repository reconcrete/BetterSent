import Elysia, { t } from "elysia";

import {
  deviceCodeInputSchema,
  deviceCodeOutputSchema,
  deviceDecisionOutputSchema,
  deviceStatusOutputSchema,
  deviceTokenInputSchema,
  deviceTokenOutputSchema,
  logoutOutputSchema,
} from "./cli.schema";
import {
  approveDeviceCode,
  createDeviceCode,
  denyDeviceCode,
  exchangeDeviceCode,
  getDeviceCodeByUserCode,
  revokeCliToken,
} from "./cli.service";
import {
  AuthorizationDeniedError,
  AuthorizationPendingError,
  DeviceCodeExpiredError,
  DeviceCodeNotFoundError,
} from "./cli.errors";
import { authMiddleware, getBearerToken } from "../../lib/auth";
import { log } from "../../lib/logger";

/** 400 = give up (expired/denied), 404 = unknown code. Used by the browser-facing routes. */
const deviceErrorStatus = (error: unknown): 400 | 404 | 500 => {
  if (error instanceof DeviceCodeExpiredError || error instanceof AuthorizationDeniedError) return 400;
  if (error instanceof DeviceCodeNotFoundError) return 404;
  return 500;
};

/** The CLI keeps polling while it sees 202, and gives up on anything else. */
const pollErrorStatus = (error: unknown): 202 | 400 | 404 | 500 =>
  error instanceof AuthorizationPendingError ? 202 : deviceErrorStatus(error);

export const cliRouter = new Elysia({ prefix: "/cli" })
  .use(authMiddleware)
  // Start a device authorization grant — called unauthenticated by `bettersent login`
  .post(
    "/device/code",
    async ({ body, set }) => {
      try {
        const data = await createDeviceCode(body?.hostname);
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Create device code error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { body: t.Optional(deviceCodeInputSchema), response: deviceCodeOutputSchema }
  )
  // Poll for the access token — called unauthenticated by the CLI while it waits for approval
  .post(
    "/device/token",
    async ({ body, set }) => {
      try {
        const data = await exchangeDeviceCode(body.deviceCode);
        return { success: true, data };
      } catch (error) {
        const status = pollErrorStatus(error);
        if (status === 500) log.error({ error }, "Device token exchange error");
        set.status = status;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { body: deviceTokenInputSchema, response: deviceTokenOutputSchema }
  )
  // Look up a pending login so the browser can show what it is about to approve
  .get(
    "/device/:userCode",
    async ({ params, set }) => {
      try {
        const data = await getDeviceCodeByUserCode(params.userCode);
        return { success: true, data };
      } catch (error) {
        const status = deviceErrorStatus(error);
        if (status === 500) log.error({ error }, "Get device code error");
        set.status = status;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, params: t.Object({ userCode: t.String() }), response: deviceStatusOutputSchema }
  )
  .post(
    "/device/:userCode/approve",
    async ({ params, user, set }) => {
      try {
        const data = await approveDeviceCode(params.userCode, user.id);
        return { success: true, data };
      } catch (error) {
        const status = deviceErrorStatus(error);
        if (status === 500) log.error({ error }, "Approve device code error");
        set.status = status;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      auth: true,
      params: t.Object({ userCode: t.String() }),
      response: deviceDecisionOutputSchema,
    }
  )
  .post(
    "/device/:userCode/deny",
    async ({ params, set }) => {
      try {
        const data = await denyDeviceCode(params.userCode);
        return { success: true, data };
      } catch (error) {
        const status = deviceErrorStatus(error);
        if (status === 500) log.error({ error }, "Deny device code error");
        set.status = status;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, params: t.Object({ userCode: t.String() }), response: deviceDecisionOutputSchema }
  )
  // Revoke the token the request was made with — `bettersent logout`
  .post(
    "/logout",
    async ({ request, user, set }) => {
      try {
        const token = getBearerToken(request.headers);
        const revoked = token ? await revokeCliToken(token, user.id) : false;
        return { success: true, data: { revoked } };
      } catch (error) {
        log.error({ error }, "CLI logout error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, response: logoutOutputSchema }
  );
