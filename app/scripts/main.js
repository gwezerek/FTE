(function () {
  'use strict';

  var querySelector = document.querySelector.bind(document);

  var margin = { top: 10, right: 10, bottom: 55, left: 10 },
  width = 466 - margin.left - margin.right,
  height = 310 - margin.top - margin.bottom;

  var svg = d3.select( '.graphic__wrap--scatter' )
    .append( 'svg' )
    .attr( 'width', width + margin.left + margin.right)
    .attr( 'height', height + margin.top + margin.bottom);

  var g = svg.append( 'g' )
    .attr( 'transform', 'translate( ' + margin.left + ',' + margin.top + ' )' );

  var xScale = d3.scale.linear()
    .domain( [ -260, 260 ] )
    .range( [ width, 0 ] );

  var yScale = d3.scale.linear()
    .domain([ 0, 295 ])
    .range( [ height, 0 ] );

  var rScale = d3.scale.sqrt()
    .clamp( true )
    .domain( [ 0, 3 ] )
    .range( [ 0, 5 ] );

  var colorScale = d3.scale.quantize()
      .domain( [ 0, 10 ] )
      .range( ['rgb(237,248,251)','rgb(179,205,227)','rgb(140,150,198)','rgb(136,86,167)','rgb(129,15,124)'] );

  var hexbin = d3.hexbin()
    .x( function( d ) { return xScale( d.LOC_X ); } )
    .y( function( d ) { return yScale( d.LOC_Y ); } )
    .size( [ width, height ] )
    .radius( 5 );

  d3.json( 'data/2009_2010_nba.json', function(data) {
    let playerShots = mungePlayerShots( data );

    g.selectAll( '.hexagon' )
        .data( hexbin( playerShots ) )
      .enter().append( 'path' )
        .attr( 'class', 'hexagon' )
        .attr( 'd', function( d ) { return hexbin.hexagon( rScale( d.length ) ); } )
        .attr( 'fill', function( d ) { return colorScale( d.length ); } )
        .attr( 'transform', function( d ) { return 'translate( ' + d.x + ',' + d.y + ' )'; } );
  });

  function mungePlayerShots( data ) {
    let playerShots = [];

    // Merge header array with rows
    _.each( data.resultSets[0].rowSet, function( shot, i ) {
      playerShots.push(_.object(data.resultSets[0].headers, shot));
    });

    return playerShots;
  }

  function mungeLeagueAverages( data ) {
    let leagueAverages = [];

    _.each( data.resultSets[1].rowSet, function( average, i ) {
      leagueAverages.push(_.object(data.resultSets[1].headers, average));
    });

    return leagueAverages;
  }

  function mergeEfficiency( playerShots, leagueAverages ) {
    _.each( playerShots, function( shot, i) {
      // Refactor
      playerShots[i].fg_pct = _.findWhere( leagueAverages, { SHOT_ZONE_AREA: shot.zone } ).FG_PCT;
    })

    return playerShots;
  }

})();
