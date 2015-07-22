(function () {
  'use strict';

  // State lets, icky, but will do for now
  let mungedData = {
    '2009': [],
    '2010': []
  }

  let margin = { top: 10, right: 10, bottom: 55, left: 10 },
  width = 466 - margin.left - margin.right,
  height = 310 - margin.top - margin.bottom;

  let xScale = d3.scale.linear()
    .domain( [ -260, 260 ] )
    .range( [ width, 0 ] );

  let yScale = d3.scale.linear()
    .domain([ 0, 295 ])
    .range( [ height, 0 ] );

  let rScale = d3.scale.sqrt()
    .clamp( true )
    .domain( [ 0, 6 ] )
    .range( [ 0, 6 ] );

  let colorScale = d3.scale.quantize()
    .domain( [ 0, 10 ] )
    .range( ['rgb(255,255,204)','rgb(255,237,160)','rgb(254,217,118)','rgb(254,178,76)','rgb(253,141,60)','rgb(252,78,42)','rgb(227,26,28)','rgb(189,0,38)','rgb(128,0,38)'] );

  let hexbin = d3.hexbin()
    .x( function( d ) { return xScale( d.LOC_X ); } )
    .y( function( d ) { return yScale( d.LOC_Y ); } )
    .size( [ width, height ] )
    .radius( 6 );

  queue()
    .defer(d3.json, 'data/2009_2010_nba.json' )
    .defer(d3.json, 'data/2010_2011_nba.json' )
    .await( initViz );

  function initViz( err, data2009, data2010 ) {
    mungedData['2009'] = mungePlayerShots( data2009 );
    mungedData['2010'] = mungePlayerShots( data2010 );

    drawViz();
  }

  function mungePlayerShots( data ) {
    let playerShots = [];

    // Merge header array with rows
    _.each( data.resultSets[0].rowSet, function( shot, i ) {
      playerShots.push(_.object(data.resultSets[0].headers, shot));
    });

    return playerShots;
  }

  function drawViz() {
    _.each( _.keys( mungedData ), function( season, i ) {
      let svg = d3.select( '#js--viz__wrap--' + season )
        .append( 'svg' )
        .attr( 'width', width + margin.left + margin.right)
        .attr( 'height', height + margin.top + margin.bottom);

      let g = svg.append( 'g' )
        .attr( 'transform', 'translate( ' + margin.left + ',' + margin.top + ' )' );

      g.selectAll( '.hexagon' )
          .data( hexbin( mungedData[ season ] ) )
        .enter().append( 'path' )
          .attr( 'class', 'hexagon' )
          .attr( 'd', function( d ) { return hexbin.hexagon( rScale( d.length ) ); } )
          .attr( 'fill', function( d ) { return colorScale( d.length ); } )
          .attr( 'transform', function( d ) { return 'translate( ' + d.x + ',' + d.y + ' )'; } );
    });

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
