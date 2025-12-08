import {
  confirm,
  intro,
  isCancel,
  log,
  outro,
  spinner,
  text,
} from "@clack/prompts";

import kleur from "kleur";

import { Context, Effect, pipe, Schema } from "effect";

export class Endpoint extends Context.Tag("Endpoint")<
  Endpoint,
  string
>() {}

class CancelError extends Error {}

const emailRegex = /^[^@]+@[^@]+.[^@]+$/;

const SignupPayload = Schema.Struct({
  email: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
});

type SignupPayload = typeof SignupPayload.Type;

export class InvalidEmail extends Schema.TaggedError<InvalidEmail>(
  "@error/InvalidEmail",
)("@error/InvalidEmail", { message: Schema.String }) {}

export class DuplicateEmail extends Schema.TaggedError<DuplicateEmail>(
  "@error/DuplicateEmail",
)("@error/DuplicateEmail", { message: Schema.String }) {}

export const TenancyData = Schema.TaggedStruct("TenancyData", {
  tenancyId: Schema.String,
  apiKey: Schema.String,
});

export type TenancyData = typeof TenancyData.Type;

const captureSignupData = async (): Promise<SignupPayload | CancelError> => {
  const email = await text({
    message:
      "Root account email? (we'll send a single use code to this address)",

    placeholder: "jdoe@gmail.com",

    validate(value) {
      if (value.length === 0) return `Value is required!`;
      if (!emailRegex.test(value))
        return `Please provide a valid email address!`;
    },
  });

  if (isCancel(email)) return new CancelError();

  const firstName = await text({
    message: "Your first/given name",

    placeholder: "John",

    validate(value) {
      if (value.length === 0) return `Value is required!`;
    },
  });

  if (isCancel(firstName)) return new CancelError();

  const lastName = await text({
    message: "Your last/family name",

    placeholder: "Doe",

    validate(value) {
      if (value.length === 0) return `Value is required!`;
    },
  });

  if (isCancel(lastName)) return new CancelError();

  const isConfirmed = await confirm({
    message: `Using ${firstName} ${lastName} <${email}>, continue?`,
  });

  if (isCancel(isConfirmed)) return new CancelError();

  return isConfirmed
    ? { email, firstName, lastName }
    : await captureSignupData();
};

const signup = async (
  url: string,
  payload: SignupPayload,
): Promise<TenancyData | InvalidEmail | DuplicateEmail> => {
  const requestBody = pipe(
    Schema.encodeSync(SignupPayload)(payload),
    JSON.stringify,
  );

  const res = await fetch(url, {
    method: "post",
    body: requestBody,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const responseBody = await res.json();

  if (!res.ok) {
    return Schema.decodeUnknownSync(Schema.Union(InvalidEmail, DuplicateEmail))(responseBody)
  } else {
    return Schema.decodeUnknownSync(TenancyData)(responseBody)
  }
};

const _init = async (url: string) => {
  intro(`Setting up new Passlock cloud instance...`);

  const email = await captureSignupData();
  if (email instanceof CancelError) {
    outro("Aborting");
    return;
  }

  const s = spinner();
  s.start("Setting up instance");
  const signupData = await signup(url, email);
  if (signupData instanceof DuplicateEmail) {
    s.stop("Email in use", 1);
    log.error("Please sign in at https://console.passlock.dev");
    return;
  } else if (signupData instanceof InvalidEmail) {
    s.stop("Invalid email", 1);
    log.error("Please sign in at https://console.passlock.dev");
    return;
  } else {
    s.stop("Instance ready");
  }

  log.success("Here are your instance credentials\nPlease keep them secure");

  const message = 
    `Tenancy ID: ${kleur.blue(signupData.tenancyId)}\n` + 
    `API Key: ${kleur.blue(signupData.apiKey)}`;
    
  log.message(message);

  log.message(
    "Please refer to the quick start at https://passlock.dev/getting-started/",
  );

  outro("You're all set!");
};

export default pipe(
  Endpoint,
  Effect.flatMap((endpoint) =>
    Effect.promise(() => _init(`${endpoint}/signup`))
  )
)
