(function () {
  'use strict';

  var querySelector = document.querySelector.bind(document);

  var margin = {top: 20, right: 40, bottom: 30, left: 40},
  width = 640 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  var svg = d3.select(".graphic__wrap--scatter")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

  var xScale = d3.scale.linear()
  .domain([0, 100])
  .range([0, width]);

  var yScale = d3.scale.linear()
  .domain([0.05, 0])
  .range([0, height]);

  d3.csv('data/qbr_consistency_final.csv', function(dataset) {
    console.log(dataset);

    svg.selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("cx", function(d) {
      return xScale(d.mean);
    })
    .attr("cy", function(d) {
      return yScale(1/d.std);
    })
    .attr("r", 5);

    svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function(d) {
     return d.name;
   })
    .attr("x", function(d) {
     return xScale(d.mean);
   })
    .attr("y", function(d) {
     return yScale(1/d.std);
   })
  });
})();
