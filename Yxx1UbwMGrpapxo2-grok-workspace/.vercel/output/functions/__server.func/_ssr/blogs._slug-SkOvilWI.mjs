import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as BlogArticlePage } from "./site-Cp8Pww_l.mjs";
import { n as Route } from "./router-HJC2v6Sy.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blogs._slug-SkOvilWI.js
var import_jsx_runtime = require_jsx_runtime();
function BlogPost() {
	const { slug } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlogArticlePage, { slug });
}
//#endregion
export { BlogPost as component };
