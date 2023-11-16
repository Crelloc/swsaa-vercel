require("dotenv").config();
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const isDev = process.env.NODE_ENV !== "production";
const helmet = require("helmet");
const { v4 } = require("uuid");
const logger = require("morgan");
const express = require("express");
const errorHandler = require("errorhandler");
const methodOverride = require("method-override");
const find = require("lodash/find");

const app = express();
const path = require("path");
const PORT = 3696;

const Prismic = require("@prismicio/client");
const PrismicDOM = require("prismic-dom");
const UAParser = require("ua-parser-js");

// Multi-process to utilize all CPU cores.
if (!isDev && cluster.isMaster) {
  console.error(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.error(
      `Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`
    );
  });
} else {
  app.use(logger("dev"));
  app.use(express.urlencoded({ extended: false }));
  app.use(methodOverride());
  app.use(errorHandler());
  app.use(express.static(path.join(__dirname, "public")));
  app.use(express.static(path.join(__dirname, "views")));

  const initApi = (req) => {
    return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
      accessToken: process.env.PRISMIC_ACCESS_TOKEN,
      req,
    });
  };

  const handleLinkResolver = (doc) => {
    if (doc.type === "product") {
      return `/detail/${doc.slug}`;
    }

    if (doc.type === "collections") {
      return "/collections";
    }

    if (doc.type === "ab") {
      return "/about";
    }

    return "/";
  };

  app.use((req, res, next) => {
    const ua = UAParser(req.headers["user-agent"]);

    res.locals.isDesktop = ua.device.type === undefined;
    res.locals.isPhone = ua.device.type === "mobile";
    res.locals.isTablet = ua.device.type === "tablet";

    res.locals.Link = handleLinkResolver;

    res.locals.Numbers = (index) => {
      return index == 0
        ? "One"
        : index == 1
        ? "Two"
        : index == 2
        ? "Three"
        : index == 3
        ? "Four"
        : "";
    };

    res.locals.PrismicDOM = PrismicDOM;

    next();
  });

  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");

  const handleRequest = async (api) => {
    const meta = await api.getSingle("metadata");
    const navigation = await api.getSingle("navigation");
    const preloader = await api.getSingle("preloade");

    return {
      meta,
      navigation,
      preloader,
    };
  };

  app.get("/", async (req, res) => {
    const api = await initApi(req);
    const defaults = await handleRequest(api);
    const home = await api.getSingle("home");
    const { results: collections } = await api.query(
      Prismic.Predicates.at("document.type", "collec"),
      {
        fetchLinks: "product.image, product.model",
      }
    );

    // console.log("defaults:\n", { ...defaults });
    res.render("pages/home", {
      ...defaults,
      home,
      collections,
    });
  });

  app.get("/about", async (req, res) => {
    const api = await initApi(req);
    const defaults = await handleRequest(api);
    const about = await api.getSingle("ab");
    res.render("pages/about", {
      ...defaults,
      about,
    });
  });

  app.get("/collections", async (req, res) => {
    const api = await initApi(req);
    const defaults = await handleRequest(api);
    const home = await api.getSingle("home");
    const { results: collections } = await api.query(
      Prismic.Predicates.at("document.type", "collec"),
      {
        fetchLinks: "product.image, product.model",
      }
    );
    res.render("pages/collections", {
      ...defaults,
      collections,
      home,
    });
  });

  app.get("/detail/:uid", async (req, res) => {
    const api = await initApi(req);
    const defaults = await handleRequest(api);
    const home = await api.getSingle("home");
    const product = await api.getByUID("product", req.params.uid, {
      fetchLinks: "collec.title",
    });

    console.log(product.data.highlights);
    res.render("pages/detail", {
      ...defaults,
      product,
      home,
    });
  });

  app.post("/__cspreport__", (req, res) => {
    console.log(req.body);
  });

  app.listen(PORT, () => {
    console.log(
      `Node ${
        isDev ? "dev server" : "cluster worker " + process.pid
      }: listening on port ${PORT}`
    );
  });
}

module.exports = app;
