import { apm } from "@elastic/apm-rum";
import { getWithTransaction } from "./get-with-transaction";

var withTransaction = getWithTransaction(apm);
export { withTransaction };
