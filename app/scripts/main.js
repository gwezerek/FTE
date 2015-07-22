( function () {
  'use strict';

  // State vars, icky, but will do for now
  var mungedData = {
    '2009': [],
    '2010': [],
    'leagueAverages2009': [],
    'leagueAverages2010': []
  };

  var toPercent = d3.format( '.0%' );

  var margin = { top: 10, right: 10, bottom: 55, left: 10 },
  width = 466 - margin.left - margin.right,
  height = 310 - margin.top - margin.bottom;

  var xScale = d3.scale.linear()
    .domain( [ -260, 260 ] )
    .range( [ width, 0 ] );

  var yScale = d3.scale.linear()
    .domain([ 0, 295 ])
    .range( [ height, 0 ] );

  var rScale = d3.scale.sqrt()
    .clamp( true )
    .domain( [ 0, 6 ] )
    .range( [ 0, 6 ] );

  var colorScaleSeq = d3.scale.quantize()
    .domain( [ 0, 10 ] )
    .range( ['rgb(255,247,251)','rgb(236,226,240)','rgb(208,209,230)','rgb(166,189,219)','rgb(103,169,207)','rgb(54,144,192)','rgb(2,129,138)','rgb(1,108,89)','rgb(1,70,54)'] );

  var colorScaleDiv = d3.scale.quantize()
    .domain( [ -0.1, 0.1 ] )
    .range( ['rgb( 253,174,97)','rgb(254,224,144)','rgb(255,255,191)','rgb(224,243,248)','rgb(171,217,233)'] );

  var hexbin = d3.hexbin()
    .x( function( d ) { return xScale( d.LOC_X ); } )
    .y( function( d ) { return yScale( d.LOC_Y ); } )
    .size( [ width, height ] )
    .radius( 6 );

  queue()
    .defer(d3.json, 'data/2009_2010_nba.json' )
    .defer(d3.json, 'data/2010_2011_nba.json' )
    .await( initViz );

  function initViz( err, data2009, data2010 ) {
    mungedData.leagueAverages2009 = mungeLeagueAverages( data2009 );
    mungedData.leagueAverages2010 = mungeLeagueAverages( data2010 );
    mungedData['2009'] = mungePlayerShots( data2009, '2009' );
    mungedData['2010'] = mungePlayerShots( data2010, '2010' );

    drawViz();
  }

  function mungePlayerShots( data, year ) {
    var playerShots = [];

    // Merge header array with rows
    _.each( data.resultSets[0].rowSet, function( shot, i ) {
      playerShots.push( _.object( data.resultSets[ 0 ].headers, shot ) );
      playerShots[ i ].avg_fg_pct = _.findWhere( mungedData['leagueAverages' + year ], {
        'SHOT_ZONE_BASIC': playerShots[ i ].SHOT_ZONE_BASIC,
        'SHOT_ZONE_AREA': playerShots[ i ].SHOT_ZONE_AREA
      }).FG_PCT;
    });

    var playerFgPcts = d3.nest()
      .key( function( d ) { return d.SHOT_ZONE_BASIC; })
      .key( function( d ) { return d.SHOT_ZONE_AREA; })
      .rollup( function( shots ) {
        return { 'fg_pct': d3.sum( shots, function( d ) {
          return d.SHOT_MADE_FLAG;
        }) /  shots.length };
      })
      .map( playerShots );

    _.each( playerShots, function( shot, i ) {
      playerShots[i].fg_pct = playerFgPcts[ shot.SHOT_ZONE_BASIC ][ shot.SHOT_ZONE_AREA ].fg_pct;
    });

    return playerShots;
  }

  function drawViz() {
    _.each( _.keys( mungedData ), function( season, i ) {
      var svg = d3.select( '#js--viz__wrap--' + season )
        .append( 'svg' )
        .attr( 'width', width + margin.left + margin.right)
        .attr( 'height', height + margin.top + margin.bottom);

      var g = svg.append( 'g' )
        .attr( 'transform', 'translate( ' + margin.left + ',' + margin.top + ' )' );

      g.selectAll( '.hexagon' )
          .data( hexbin( mungedData[ season ] ) )
        .enter().append( 'path' )
          .attr( 'class', 'hexagon' )
          .attr( 'd', function( d ) { return hexbin.hexagon( rScale( d.length ) ); } )
          .attr( 'fill', function( d ) { return colorScaleSeq( d.length ); } )
          .attr( 'transform', function( d ) { return 'translate( ' + d.x + ',' + d.y + ' )'; } )
        .append( 'title' )
          .text( function(d, i) { return d.length + ' shots attempted'; } );

      var svgE = d3.select( '#js--viz__wrap--efficiency--' + season )
        .append( 'svg' )
        .attr( 'width', width + margin.left + margin.right)
        .attr( 'height', height + margin.top + margin.bottom);

      var gE = svgE.append( 'g' )
        .attr( 'transform', 'translate( ' + margin.left + ',' + margin.top + ' )' );

      gE.selectAll( '.hexagon' )
          .data( hexbin( mungedData[ season ] ) )
        .enter().append( 'path' )
          .classed( 'hexagon hexagon--efficiency', true )
          .attr( 'd', function( d ) { return hexbin.hexagon( rScale( d.length ) ); } )
          .attr( 'fill', function( d ) { return colorScaleDiv( d[ 0 ].fg_pct - d[ 0 ].avg_fg_pct ); } )
          .attr( 'transform', function( d ) { return 'translate( ' + d.x + ',' + d.y + ' )'; } )
        .append( 'title' )
          .text( function(d, i) { return toPercent( d[0].fg_pct ) + ' made vs. ' + toPercent( d[0].avg_fg_pct ) + ' league average'; } );
    });

  }

  function mungeLeagueAverages( data ) {
    var leagueAverages = [];

    _.each( data.resultSets[1].rowSet, function( average, i ) {
      leagueAverages.push(_.object(data.resultSets[1].headers, average));
    });

    return leagueAverages;
  }

})();
