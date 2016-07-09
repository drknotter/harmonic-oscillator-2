var pi = 3.14159265358979323846;
var colors = ['#000000','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff'];
var color_count = [0,0,0,0,0,0,0];
var systems = [];

var vMargin = 20; var hMargin = 40;
var tMax = 10; var xMax = 5;
var tAnimateScale = 5, dt = 20;// in milliseconds
var xPhaseMax = 10; var xpPhaseMax = 10;
var massHPercent = 0.8;
var massWPercent = 0.9;

var svg, graph, phasePlane;
var svgHPercent = 0.7; var graphHPercent = 0.8;

function initialize() {

    var windowWidth = window.innerWidth-5;
    var windowHeight = window.innerHeight-5;

    // initialize the canvas
    svg = d3.select('body').append('svg')
        .attr('width',windowWidth).attr('height',windowHeight*svgHPercent)
        //.style('position','absolute')
        .style('top','0px').style('left','0px');
    svg.append('rect').attr('class','background')
        .attr('width',windowWidth).attr('height',windowHeight*svgHPercent)
        .attr('fill','#ddd');

    graph = svg.append('g').attr('class','graph')
        .attr('transform','translate('+hMargin+','+vMargin+')');
    phasePlane = svg.append('g').attr('class','phasePlane')
        .attr('transform','translate('+(0.5*(windowWidth+hMargin))+','+vMargin+')');

    graph.append("g")
        .attr("class", "x grid");
    graph.append("g")
        .attr("class", "y grid");

    graph.append('g')
        .attr('class','curveGroup');

    phasePlane.append("g")
        .attr("class", "x grid");
    phasePlane.append("g")
        .attr("class", "y grid");

    phasePlane.append('g')
        .attr('class','curveGroup');

    systems.push({mass:3,damping:2,spring:20,x0:4,xp0:0,color:colors[0]});
    color_count[0] += 1;

    d3.select('body').append('div').attr('class','controlGroup')
    draw_controls();

    d3.select('body').append('div')
        .style('background-color','#aaa')
        .style('width','100px')
        .style('margin','10px')
        .style('padding','10px')
        .style('color','#fff')
        .style('font-weight','bold')
        .style('text-align','center')
        .style('cursor','pointer')
        .text('New System')
        .on('click',add_system);
        
    draw_axes();
    draw_curves();
    
}


function draw_axes() {
    
    var windowWidth = window.innerWidth-5;
    var windowHeight = window.innerHeight-5;

    var t_scale = d3.scale.linear().domain([0,tMax])
        .range([0,(windowWidth-3*hMargin)/2]);
    var x_scale = d3.scale.linear().domain([-xMax,xMax])
        .range([windowHeight*svgHPercent*graphHPercent-2*vMargin,0]);

    var x_phase_scale = d3.scale.linear().domain([-xPhaseMax,xPhaseMax])
        .range([0,(windowWidth-3*hMargin)/2]);
    var xp_phase_scale = d3.scale.linear().domain([-xpPhaseMax,xpPhaseMax])
        .range([windowHeight*svgHPercent*graphHPercent-2*vMargin,0]);
    
    graph.select('.x.grid')
        .call(d3.svg.axis().scale(t_scale)
              .tickSize(-(windowHeight*svgHPercent*graphHPercent-2*vMargin))
              .tickSubdivide(3)
              .tickFormat(d3.format('d')))
        .attr('transform','translate(0,'+(windowHeight*svgHPercent*graphHPercent-2*vMargin)+')');
    graph.select('.y.grid')
        .call(d3.svg.axis().scale(x_scale)
              .tickSize(-((windowWidth-3*hMargin)/2))
              .tickSubdivide(3)
              .tickFormat(d3.format('d'))
              .orient('left'));

    phasePlane.select('.x.grid')
        .call(d3.svg.axis().scale(x_phase_scale)
              .tickSize(-(windowHeight*svgHPercent*graphHPercent-2*vMargin))
              .tickSubdivide(3)
              .tickFormat(d3.format('d')))
        .attr('transform','translate(0,'+(windowHeight*svgHPercent*graphHPercent-2*vMargin)+')');
    phasePlane.select('.y.grid')
        .call(d3.svg.axis().scale(xp_phase_scale)
              .tickSize(-((windowWidth-3*hMargin)/2))
              .tickSubdivide(3)
              .tickFormat(d3.format('d'))
              .orient('left'));
}

function draw_curves() {
    
    var windowWidth = window.innerWidth-5;
    var windowHeight = window.innerHeight-5;
    
    var t_scale = (windowWidth-3*hMargin)/(2*tMax);
    var x_scale = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/(2*xMax);
    var x_offset = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/2;

    var x_phase_scale = (windowWidth-3*hMargin)/(4*xPhaseMax);
    var xp_phase_scale = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/(2*xpPhaseMax);
    var x_phase_offset = (windowWidth-3*hMargin)/4;
    var xp_phase_offset = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/2;

    function gen_graph_data(d) {
        var soln_type = -1;
        var discriminant = d.damping*d.damping-4*d.mass*d.spring;
        if( discriminant > 0.00000000001 ) {
            soln_type = 0;
        } else if( Math.abs(discriminant) <= 0.00000000001 ) {
            soln_type = 1;
        } else {
            soln_type = 2;
        }

        function soln(t) {
            if( soln_type == 0 ) {
                var r1 = (-d.damping+Math.sqrt(discriminant))/(2*d.mass);
                var r2 = (-d.damping-Math.sqrt(discriminant))/(2*d.mass);
                var c1 = (d.xp0-r2*d.x0)/(r1-r2);
                var c2 = (d.xp0-r1*d.x0)/(r2-r1);
                return c1*Math.exp(r1*t)+c2*Math.exp(r2*t);
            } else if( soln_type == 1 ) {
                var r = -d.damping/(2*d.mass);
                var c1 = d.x0;
                var c2 = d.xp0-r*d.x0;
                return c1*Math.exp(r*t) + c2*t*Math.exp(r*t);
            } else if( soln_type == 2 ) {
                var alpha = -d.damping/(2*d.mass);
                var beta = Math.sqrt(-discriminant)/(2*d.mass);
                var c1 = d.x0;
                var c2 = (d.xp0-alpha*d.x0)/beta;
                return c1*Math.exp(alpha*t)*Math.cos(beta*t)+c2*Math.exp(alpha*t)*Math.sin(beta*t);
            } else {
                return 0;
            }
        }

        var path_data = 'M ';
        path_data += 0;
        path_data += ' ';
        path_data += -x_scale*soln(0)+x_offset;
        for( var i=1; i<=200; i++ ) {
            path_data += ' L ';
            t = i*tMax/200;
            path_data += (t*t_scale);
            path_data += ' ';
            path_data += -x_scale*soln(t)+x_offset;
        }
        return path_data;        
    }
    
    function gen_phase_data(d) {
        var soln_type = -1;
        var discriminant = d.damping*d.damping-4*d.mass*d.spring;
        if( discriminant > 0.00000000001 ) {
            soln_type = 0;
        } else if( Math.abs(discriminant) <= 0.00000000001 ) {
            soln_type = 1;
        } else {
            soln_type = 2;
        }

        function soln(t) {
            if( soln_type == 0 ) {
                var r1 = (-d.damping+Math.sqrt(discriminant))/(2*d.mass);
                var r2 = (-d.damping-Math.sqrt(discriminant))/(2*d.mass);
                var c1 = (d.xp0-r2*d.x0)/(r1-r2);
                var c2 = (d.xp0-r1*d.x0)/(r2-r1);
                return [c1*Math.exp(r1*t)+c2*Math.exp(r2*t),
                        r1*c1*Math.exp(r1*t)+r2*c2*Math.exp(r2*t)];
            } else if( soln_type == 1 ) {
                var r = -d.damping/(2*d.mass);
                var c1 = d.x0;
                var c2 = d.xp0-r*d.x0;
                return [c1*Math.exp(r*t)+c2*t*Math.exp(r*t),
                        r*c1*Math.exp(r*t)+c2*(Math.exp(r*t)+r*t*Math.exp(r*t))];
            } else if( soln_type == 2 ) {
                var alpha = -d.damping/(2*d.mass);
                var beta = Math.sqrt(-discriminant)/(2*d.mass);
                var c1 = d.x0;
                var c2 = (d.xp0-alpha*d.x0)/beta;
                return [c1*Math.exp(alpha*t)*Math.cos(beta*t)
                           +c2*Math.exp(alpha*t)*Math.sin(beta*t),
                        c1*Math.exp(alpha*t)*(alpha*Math.cos(beta*t)-beta*Math.sin(beta*t))
                           +c2*Math.exp(alpha*t)*(alpha*Math.sin(beta*t)+beta*Math.cos(beta*t))];
            } else {
                return [0,0];
            }
        }

        var path_data = 'M ';
        path_data += x_phase_scale*soln(0)[0]+x_phase_offset;
        path_data += ' ';
        path_data += -xp_phase_scale*soln(0)[1]+xp_phase_offset;
        for( var i=1; i<=200; i++ ) {
            path_data += ' L ';
            t = i*tMax/200;
            path_data += x_phase_scale*soln(t)[0]+x_phase_offset;
            path_data += ' ';
            path_data += -xp_phase_scale*soln(t)[1]+xp_phase_offset;
        }
        return path_data;        
    }
    
    graph.select('.curveGroup').selectAll('.curve').remove();
    var curves = graph.select('.curveGroup').selectAll('.curve').data(systems);
    
    curves.enter()
        .append('svg:path').attr('class','curve')
        .attr('stroke-width','5px')
        .attr('stroke',function(d){return d.color;})
        .attr('stroke-linecap','round')
        .attr('fill','none')
        .attr('stroke-linejoin','round');
        
    curves.attr('d',gen_graph_data);
    
    phasePlane.select('.curveGroup').selectAll('.curve').remove();
    var curves = phasePlane.select('.curveGroup').selectAll('.curve').data(systems);
    
    curves.enter()
        .append('svg:path').attr('class','curve')
        .attr('stroke-width','5px')
        .attr('stroke',function(d){return d.color;})
        .attr('stroke-linecap','round')
        .attr('fill','none')
        .attr('stroke-linejoin','round');
        
    curves.attr('d',gen_phase_data);
}

function draw_controls() {

    d3.select('.controlGroup').selectAll('.control').remove();
    var controlGroup = d3.select('.controlGroup').selectAll('.control').data(systems);
    
    var controls = controlGroup.enter().append('div')
        .attr('class','control')
        .style('margin','10px 10px 0px 10px');

    controls.append('div')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('vertical-align','middle')
        .style('width','20px').style('height','20px')
        .style('background-color',function(d){return d.color;})
        .style('color','#fff')
        .style('text-align','center')
        .style('cursor','pointer')
        .style('font-weight','bold')
        .text('x')
        .on('click',remove_system);

    var ctrl = controls.append('div')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('vertical-align','middle');

    ctrl.append('div').attr('class','massText')
        .text(function(d){return 'Mass: '+Number(d.mass).toFixed(1);});
    
    ctrl.append('input')
        .attr('type','range')
        .attr('min','0.1').attr('max','10.0000001')
        .attr('value',function(d){return d.mass;})
        .attr('step','0.1')
        .style('display','block')
        .on('change',function(d){
                d.mass = Number(this.value);
                d3.select(this.parentElement).select('.massText')
                    .text('Mass: '+Number(d.mass).toFixed(1));
                d3.select(this.parentElement.parentElement).select('.systemText')
                    .html(systemText(d));
                draw_curves();
            });

    var ctrl = controls.append('div')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('vertical-align','middle');

    ctrl.append('div').attr('class','dampingText')
        .text(function(d){return 'Damping: '+Number(d.damping).toFixed(2);});
    
    ctrl.append('input')
        .attr('type','range')
        .attr('min','0.0').attr('max','10.0000001')
        .attr('value',function(d){return d.damping;})
        .attr('step','0.05')
        .style('display','block')
        .on('change',function(d){
                d.damping = Number(this.value);
                d3.select(this.parentElement).select('.dampingText')
                    .text('Damping: '+Number(d.damping).toFixed(2));
                d3.select(this.parentElement.parentElement).select('.systemText')
                    .html(systemText(d));
                draw_curves();
            });

    var ctrl = controls.append('div')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('vertical-align','middle');

    ctrl.append('div').attr('class','springText')
        .text(function(d){return 'Spring: '+Number(d.spring).toFixed(1);});
    
    ctrl.append('input')
        .attr('type','range')
        .attr('min','0.1').attr('max','50.0000001')
        .attr('value',function(d){return d.spring;})
        .attr('step','0.1')
        .style('display','block')
        .on('change',function(d){
                d.spring = Number(this.value);
                d3.select(this.parentElement).select('.springText')
                    .text('Spring: '+Number(d.spring).toFixed(1));
                d3.select(this.parentElement.parentElement).select('.systemText')
                    .html(systemText(d));
                draw_curves();
            });

    var ctrl = controls.append('div')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('vertical-align','middle');

    ctrl.append('div').attr('class','x0Text')
        .html(function(d){return '<i>x</i>(0): '+Number(d.x0).toFixed(1);});
    
    ctrl.append('input')
        .attr('type','range')
        .attr('min','-5.0000001').attr('max','5.0000001')
        .attr('value',function(d){return d.x0;})
        .attr('step','0.1')
        .style('display','block')
        .on('change',function(d){
                d.x0 = Number(this.value);
                d3.select(this.parentElement).select('.x0Text')
                    .html('<i>x</i>(0): '+Number(d.x0).toFixed(1));
                d3.select(this.parentElement.parentElement).select('.systemText')
                    .html(systemText(d));
                draw_curves();
            });

    var ctrl = controls.append('div')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('vertical-align','middle');

    ctrl.append('div').attr('class','xp0Text')
        .html(function(d){return '<i>x&#775;</i>(0): '+Number(d.xp0).toFixed(1);});
    
    ctrl.append('input')
        .attr('type','range')
        .attr('min','-10.0000001').attr('max','10.0000001')
        .attr('value',function(d){return d.xp0;})
        .attr('step','0.1')
        .style('display','block')
        .on('change',function(d){
                d.xp0 = Number(this.value);
                d3.select(this.parentElement).select('.xp0Text')
                    .html('<i>x&#775;</i>(0): '+Number(d.xp0).toFixed(1));
                d3.select(this.parentElement.parentElement).select('.systemText')
                    .html(systemText(d));
                draw_curves();
            });

    controls.append('div')
        .attr('class','systemText')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('vertical-align','middle')
        .style('font-size','15px')
        .style('font-family','sans')
        .html(systemText);

    controls.append('div')
        .attr('class','animate')
        .style('display','inline-block')
        .style('margin','0px 10px 0px 0px')
        .style('padding','5px 10px 5px 10px')
        .style('vertical-align','middle')
        .style('background-color','#aaa')
        .style('color','#fff')
        .style('text-align','center')
        .style('cursor','pointer')
        .style('font-weight','bold')
        .text('Animate')
        .on('click',animate);    

}

function systemText(d) {
    var m = Number(d.mass).toFixed(1);
    var b = Number(d.damping).toFixed(2);
    var k = Number(d.spring).toFixed(1);
    var x0 = Number(d.x0).toFixed(1);
    var xp0 = Number(d.xp0).toFixed(1);
    return m+'<i>x&#776;</i> + '+b+'<i>x&#775;</i> + '+k+'<i>x</i> = 0,&nbsp;&nbsp;&nbsp;<i>x</i>(0) = '+x0+', <i>x&#775;</i>(0) = '+xp0;
}

function add_system() {

    var cIndex=0;
    for( var i=0; i<color_count.length; i++ ) {
        if( color_count[i] < color_count[cIndex] )
            cIndex = i;
    }
    color_count[cIndex] += 1;
    var last = systems[systems.length-1];
    systems.push({mass:last.mass,
                damping:last.damping,
                spring:last.spring,
                x0:last.x0,
                xp0:last.xp0,
                color:colors[cIndex]});
    draw_controls();
    draw_curves();

}

function remove_system(d,i) {
    
    var c = d3.rgb(this.style['background-color']).toString();
    var cIndex;
    for( cIndex=0; cIndex<colors.length; cIndex++ ) {
        if( colors[cIndex] == c )
            break;
    }
    color_count[cIndex] -= 1;
    systems.splice(i,1);
    draw_controls();
    draw_curves();
    
}

function animate(d,i) {

    var windowWidth = window.innerWidth-5;
    var windowHeight = window.innerHeight-5;
    var massGroupHeight = windowHeight*svgHPercent*(1-graphHPercent);
    
    var t_scale = (windowWidth-3*hMargin)/(2*tMax);
    var x_scale = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/(2*xMax);
    var x_offset = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/2;

    var x_phase_scale = (windowWidth-3*hMargin)/(4*xPhaseMax);
    var xp_phase_scale = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/(2*xpPhaseMax);
    var x_phase_offset = (windowWidth-3*hMargin)/4;
    var xp_phase_offset = (windowHeight*svgHPercent*graphHPercent-2*vMargin)/2;

    var mass_scale = windowWidth*massWPercent/(2*xMax);
    var mass_offset = windowWidth/2;

    // disable all animate buttons
    d3.select('.controlGroup').selectAll('.animate')
        .style('background-color','#ddd')
        .on('click',function(){});

    // remove all curves
    svg.selectAll('.curve').remove();

    // add one curve for the current system
    var thisGraphCurve = graph.select('.curveGroup').append('path')
        .attr('class','curve')
        .attr('stroke',d.color)
        .attr('stroke-width','5px')
        .attr('stroke-linecap','round')
        .attr('stroke-linejoin','round')
        .attr('fill','none');
    var thisPhasePlaneCurve = phasePlane.select('.curveGroup').append('path')
        .attr('class','curve')
        .attr('stroke',d.color)
        .attr('stroke-width','5px')
        .attr('stroke-linecap','round')
        .attr('stroke-linejoin','round')
        .attr('fill','none');

    var massGroup = svg.append('g').attr('class','massGroup')
        .attr('transform','translate(0,'+(windowHeight*svgHPercent*graphHPercent)+')');
    massGroup.append('rect').attr('class','mass')
        .attr('transform','translate('+(windowWidth/2)+','+(massGroupHeight/2)+')');
    massGroup.append('path').attr('class','spring')
        .attr('transform','translate('+(windowWidth*(1-massWPercent)/2)+','+(massGroupHeight/2)+')')
        .attr('stroke-linecap','round');

    function draw_mass(xPos) {
        
        // construct the mass
        var massSize = massGroupHeight*massHPercent;
        massGroup.select('.mass')
            .attr('x',-massSize/2+mass_scale*xPos).attr('y',-massSize/2)
            .attr('width',massSize).attr('height',massSize)
            .attr('fill',d.color);
        
        // construct the spring
        var springWidth = windowWidth*massWPercent/2-massSize/2+mass_scale*xPos;
        var springD = 'M 0 0';
        for( var i=0; i<6; i++ ) {
            springD += ' L '+(i*springWidth/6+springWidth/24)+' '+(0.8*massGroupHeight*massHPercent/2);
            springD += ' L '+(i*springWidth/6+3*springWidth/24)+' '+(-0.8*massGroupHeight*massHPercent/2);
            springD += ' L '+((i+1)*springWidth/6)+' 0';
        }
        massGroup.select('.spring')
            .attr('fill','none')
            .attr('stroke','#000')
            .attr('stroke-width','3px')
            .attr('d',springD);

    }
    
    var soln_type = -1;
    var discriminant = d.damping*d.damping-4*d.mass*d.spring;
    if( discriminant > 0.00000000001 ) {
        soln_type = 0;
    } else if( Math.abs(discriminant) <= 0.00000000001 ) {
        soln_type = 1;
    } else {
        soln_type = 2;
    }
    function soln(t) {
        if( soln_type == 0 ) {
            var r1 = (-d.damping+Math.sqrt(discriminant))/(2*d.mass);
            var r2 = (-d.damping-Math.sqrt(discriminant))/(2*d.mass);
            var c1 = (d.xp0-r2*d.x0)/(r1-r2);
            var c2 = (d.xp0-r1*d.x0)/(r2-r1);
            return [c1*Math.exp(r1*t)+c2*Math.exp(r2*t),
                    r1*c1*Math.exp(r1*t)+r2*c2*Math.exp(r2*t)];
        } else if( soln_type == 1 ) {
            var r = -d.damping/(2*d.mass);
            var c1 = d.x0;
            var c2 = d.xp0-r*d.x0;
            return [c1*Math.exp(r*t)+c2*t*Math.exp(r*t),
                    r*c1*Math.exp(r*t)+c2*(Math.exp(r*t)+r*t*Math.exp(r*t))];
        } else if( soln_type == 2 ) {
            var alpha = -d.damping/(2*d.mass);
            var beta = Math.sqrt(-discriminant)/(2*d.mass);
            var c1 = d.x0;
            var c2 = (d.xp0-alpha*d.x0)/beta;
            return [c1*Math.exp(alpha*t)*Math.cos(beta*t)
                    +c2*Math.exp(alpha*t)*Math.sin(beta*t),
                    c1*Math.exp(alpha*t)*(alpha*Math.cos(beta*t)-beta*Math.sin(beta*t))
                    +c2*Math.exp(alpha*t)*(alpha*Math.sin(beta*t)+beta*Math.cos(beta*t))];
        } else {
            return [0,0];
        }
    }
    
    draw_mass(soln(0)[0]);
    // start the animation (after a slight delay)
    setTimeout(function() {
            var t=0;
            var graphD = 'M 0 '+(-x_scale*soln(0)[0]+x_offset);
            var phasePlaneD = 'M '+(x_phase_scale*soln(0)[0]+x_phase_offset)+' '+(-xp_phase_scale*soln(0)[1]+xp_phase_offset);
            var interval = setInterval(function() {
                    draw_mass(soln(t)[0]);
                    t += dt/1000*tAnimateScale;
                    if( t > tMax ) {
                        clearInterval(interval);                
                        // reenable all animate buttons
                        d3.select('.controlGroup').selectAll('.animate')
                            .style('background-color','#aaa')
                            .on('click',animate);
                        // remove the mass diagram
                        massGroup.remove();
                        // redraw all curves
                        draw_curves();
                    } else {
                        graphD += ' L '+(t*t_scale)+' '+(-x_scale*soln(t)[0]+x_offset);
                        phasePlaneD += ' L '+(x_phase_scale*soln(t)[0]+x_phase_offset)+' '+(-xp_phase_scale*soln(t)[1]+xp_phase_offset);
                        thisGraphCurve.attr('d',graphD);
                        thisPhasePlaneCurve.attr('d',phasePlaneD);
                    }
                },dt);
        },500);

}


function draw() {

    var windowWidth = window.innerWidth-5;
    var windowHeight = window.innerHeight-5;

    // resize the canvas
    svg.attr('width',windowWidth).attr('height',windowHeight*svgHPercent)
        .style('top','0px').style('left','0px');
    svg.select('.background')
        .attr('width',windowWidth).attr('height',windowHeight*svgHPercent)
        .attr('fill','#ddd');

    // resize the grids
    graph.attr('transform','translate('+hMargin+','+vMargin+')');
    phasePlane.attr('transform','translate('+(0.5*(windowWidth+hMargin))+','+vMargin+')');

    draw_controls();
    draw_axes();
    draw_curves();

}