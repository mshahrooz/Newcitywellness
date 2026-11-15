import { createPublisher } from "./publisher.mjs";

Deno.serve(createPublisher({ env: (name: string) => Deno.env.get(name) }));
