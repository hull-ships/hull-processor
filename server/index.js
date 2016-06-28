import Hull from "hull";
import Server from "./server";


Hull.onLog(function onLog(message, data, ctx = {}) {
  console.log(`${ctx.id} ] segment.${message}`, JSON.stringify(data || ""));
});
Hull.onMetric(function onMetric(metric, value, ctx = {}) {
  console.log(`${ctx.id} ] segment.${metric}`, value);
});

Server({
  Hull,
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
