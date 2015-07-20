(function () {
  'use strict';

  var querySelector = document.querySelector.bind(document);

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 490 - margin.left - margin.right,
  height = 320 - margin.top - margin.bottom;

  var svg = d3.select('.graphic__wrap--scatter')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  var g = svg.append('g')
    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

  var xScale = d3.scale.linear()
    .range( [ 0, width ] );

  var yScale = d3.scale.linear()
    .range( [ 0, height ] );

  var rScale = d3.scale.linear()
    .range( [ 0, 5 ] );

  d3.json('data/2009_2010_nba.json', function(data) {
    let playerShots = mungePlayerShots( data );
    let leagueAverages = mungeLeagueAverages( data );

    xScale.domain( d3.extent( playerShots, function( d ) {
      return d.x_coord;
    }));

    console.log( d3.extent( playerShots, function( d ) {
      return d.x_coord;
    }) );

    yScale.domain( d3.extent( playerShots, function( d ) {
      return d.y_coord;
    }));

    rScale.domain( d3.extent( playerShots, function( d ) {
      return d.made;
    }));

    g.selectAll( 'circle' )
      .data( playerShots )
    .enter().append( 'circle' )
      .attr( 'cx', function( d ) {
        return xScale( d.x_coord );
      })
      .attr('cy', function( d ) {
        return yScale( d.y_coord );
      })
      .attr('r', function( d ) {
        return 5;
        // return rScale( d.made );
      });

  });

  function mungePlayerShots( data ) {
    let playerShots = [];
    let summaryShots = [];

    _.each( data.resultSets[0].rowSet, function( shot, i ) {
      playerShots.push(_.object(data.resultSets[0].headers, shot));
    });

    let nestedData = d3.nest()
      .key(function(d) { return d.LOC_X; })
      .key(function(d) { return d.LOC_Y; })
      .rollup(function( coord ) {
        return {
          'attempted': coord.length,
          'made': d3.sum( coord, function(d) {
            return d.SHOT_MADE_FLAG;
          })
        };
      })
      .entries(playerShots);

    _.each( nestedData, function( xCoord, i ) {
      _.each( nestedData[i].values, function( yCoord, j ) {
        let loc = nestedData[i].values[j].values;
        summaryShots.push({
          'x_coord': parseInt( xCoord.key ),
          'y_coord': parseInt( yCoord.key ),
          'attempted': loc.attempted,
          'made': loc.made
        });
      });
    });

    return summaryShots;
  }

  function mungeLeagueAverages( data ) {
    let leagueAverages = [];

    _.each( data.resultSets[1].rowSet, function( average, i ) {
      leagueAverages.push(_.object(data.resultSets[1].headers, average));
    });

    return leagueAverages;
  }

})();
