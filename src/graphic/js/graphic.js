// JS for your graphic
import pym from "pym.js";
import { select, rollup, axisLeft, format } from "d3";
import { build, ColumnChart } from "@michigandaily/bore";
import { toBlob } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import downloadImage from "./util/download-image";
import setDisplayOptions from "./util/set-display";

import csv from "../data/tax.csv";

const draw = async () => {
  const inflation = {
    1992: 2.17,
    1993: 2.1,
    1994: 2.05,
    1995: 1.99,
    1996: 1.94,
    1997: 1.88,
    1998: 1.85,
    1999: 1.82,
    2000: 1.77,
    2001: 1.71,
    2002: 1.69,
    2003: 1.65,
    2004: 1.62,
    2005: 1.57,
    2006: 1.51,
    2007: 1.48,
    2008: 1.42,
    2009: 1.42,
    2010: 1.38,
    2011: 1.36,
    2012: 1.32,
    2013: 1.3,
    2014: 1.28,
    2015: 1.28,
    2016: 1.26,
    2017: 1.23,
    2018: 1.21,
    2019: 1.19,
    2020: 1.16,
  };

  const dictionary = rollup(
    csv,
    (v) => v[0].localityName,
    (d) => d.localityId
  );

  const data = rollup(
    csv,
    (v) =>
      v[0].returns === 0 ? 0 : (v[0].tax * inflation[v[0].year]) / v[0].returns,
    (d) => d.localityId,
    (d) => d.year
  );

  const figure = select("figure");
  const width = figure.node().clientWidth;

  const svg = figure.append("svg");

  const yAxis = function (scale) {
    return (g) => {
      const selection = this.getSelectionWithRedrawContext(g);
      selection.call(axisLeft(scale).tickFormat(format("$.2s")));

      const { left, right } = this.margin();
      const w = this.getResponsiveWidth();
      selection.selectAll(".tick line").attr("x2", w - left - right);
    };
  };

  const chart = new ColumnChart()
    .label(null)
    .margin({ left: 50 })
    .yAxis(yAxis)
    .color("#50C878")
    .duration(10);

  let redraw = false;
  let i = 0;

  const zip = new JSZip();

  for await (const [key, value] of data) {
    select(".figure__title").text(
      `Average amount of income tax paid in ${dictionary.get(key)}`
    );

    svg.datum(value).call(build(chart.redraw(redraw)));
    redraw = true;

    await new Promise((resolve) => setTimeout(resolve, 20));

    const blob = await toBlob(document.body, {
      backgroundColor: "white",
      width,
    });

    zip.file(`${key}.png`, blob);
    console.log(i++);
  }

  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, "cookie-graphic.zip");
  });
};

window.onresize = () => {};

window.onload = () => {
  const child = new pym.Child({ polling: 500 });
  child.sendHeight();
  child.onMessage("download", downloadImage);
  setDisplayOptions();
  draw();
};
