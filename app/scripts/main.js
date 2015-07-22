(function () {
  'use strict';

  var querySelector = document.querySelector.bind(document);

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 440 - margin.left - margin.right,
  height = 320 - margin.top - margin.bottom;

  var svg = d3.select( '.graphic__wrap--scatter' )
    .append( 'svg' )
    .attr( 'width', width + margin.left + margin.right)
    .attr( 'height', height + margin.top + margin.bottom);

  var g = svg.append( 'g' )
    .attr( 'transform', 'translate( ' + margin.left + ',' + margin.top + ' )' );

  var xScale = d3.scale.linear()
    .domain( [ -250, 250 ] )
    .range( [ width, 0 ] );

  var yScale = d3.scale.linear()
    .domain([ -20, 345 ])
    .range( [ height, 0 ] );

  var rScale = d3.scale.sqrt()
    // .clamp( true )
    .domain( [ 0, 3 ] )
    .range( [ 0, 6 ] );

  var colorScale = d3.scale.quantize()
      .domain( [ 1, 0.4 ] )
      .range( [ '#0571b0', '#92c5de', '#f7f7f7', '#f4a582', '#ca0020' ] );

  var hexbin = d3.hexbin()
    .x( function( d ) { return xScale( d.x_coord ); } )
    .y( function( d ) { return yScale( d.y_coord ); } )
    .size( [ width, height ] )
    .radius( 6 );

  d3.json( 'data/2009_2010_nba.json', function(data) {
    let playerShots = mungePlayerShots( data );
    let leagueAverages = mungeLeagueAverages( data );
    playerShots = mergeEfficiency( playerShots, leagueAverages );

    g.selectAll( '.hexagon' )
        .data( hexbin( playerShots ) )
      .enter().append( 'path' )
        .attr( 'class', 'hexagon' )
        .attr( 'd', function( d ) { return hexbin.hexagon( rScale( d.length ) ); } )
        .attr( 'fill', function( d ) { return colorScale( d[0].fg_pct ); } )
        .attr( 'transform', function( d ) { return 'translate( ' + d.x + ',' + d.y + ' )'; } );
  });

  function mergeEfficiency( playerShots, leagueAverages ) {
    // debugger;
    _.each( playerShots, function( shot, i) {
      // Refactor
      playerShots[i].fg_pct = _.findWhere( leagueAverages, { SHOT_ZONE_AREA: shot.zone } ).FG_PCT;
    })

    return playerShots;
  }

  function mungePlayerShots( data ) {
    let playerShots = [];
    let summaryShots = [];

    _.each( data.resultSets[0].rowSet, function( shot, i ) {
      playerShots.push(_.object(data.resultSets[0].headers, shot));
    });

    let nestedData = d3.nest()
      .key(function( d ) { return d.LOC_X; })
      .key(function( d ) { return d.LOC_Y; })
      .rollup(function( coord ) {
        return {
          'zone': coord[0].SHOT_ZONE_AREA,
          'attempted': coord.length,
          'made': d3.sum( coord, function( d ) {
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
          'made': loc.made,
          'zone': loc.zone
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
