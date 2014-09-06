function uniq_colors () {
  var colors = [
        '#ff0066',
        '#ffcc00',
        '#3d9df2',
        '#e673cf',
        '#8800cc',
        '#005fb3',
        '#8c3f23',
        '#397358',
        '#ffbffb',
        '#ffd580',
        '#00e2f2',
        '#9173e6',
        '#a099cc',
        '#5995b3',
        '#994d6b',
        '#2d2080',
        '#0c0059',
        '#00401a',
        '#1a3320',
        '#f240ff',
        '#ff8800',
        '#00f2c2',
        '#e59173',
        '#3347cc',
        '#18b300',
        '#269954',
        '#205380',
        '#733d00',
        '#161f59',
        '#364010',
        '#0000ff',
        '#ffc8bf',
        '#79f299',
        '#0000d9',
        '#99cca7',
        '#b29559',
        '#7f7700',
        '#730000',
        '#305900',
        '#331a1a',
        '#bfe1ff',
        '#ff0000',
        '#baf279',
        '#a3d5d9',
        '#cc8533',
        '#b38686',
        '#59468c',
        '#7f4840',
        '#66001b',
        '#134d49',
        '#401100',
        '#40bfff',
        '#ff8080',
        '#def2b6',
        '#d94c36',
        '#cc5200',
        '#a67c98',
        '#23858c',
        '#6d1d73',
        '#005266',
        '#73ff40',
        '#f2b6c6',
        '#f2d6b6',
        '#cc3347',
        '#0000bf',
        '#29a68d',
        '#8c6246',
        '#565a73',
        '#57664d',
        '#400033',
        '#331a31',
        '#ccff00',
        '#f279aa',
        '#f20000',
        '#cc0088',
        '#b2bf00',
        '#95a653',
        '#8c7769',
        '#566973',
        '#592d39',
        '#002240'
      ];
  return colors;
}

function uniq_color(module_id)
{
  var colors = uniq_colors();

  var sum = 0;
  (module_id || "").toString().split('').forEach(function (e) {
    sum += e.charCodeAt(0);
  });

  var id = sum % (colors.length);

  console.log(module_id, id, colors[id]);

  return colors[id];
}

function calc_service_call_count(callee_properties)
{
  var service_call_count = 0;
  if(callee_properties.services)
  {
    for(var service in callee_properties.services)
    {
      service_call_count += callee_properties.services[service];
    }
  }
  else
  {
    service_call_count = 1;
  }
  return service_call_count;
} 

function formatIntOrFloat(number)
{

  return Math.round(number) == number ? 
        number.toString() : number.toFixed(2);
}

var RiverNet = function (module_json_descriptor) {
  this.modules = module_json_descriptor.modules;
  this.meta = module_json_descriptor.meta;
  this.zoom = d3.behavior.zoom();
  this.unit = this.meta.unit == null? '/sec' : this.meta.unit;
};

RiverNet.prototype = {
  construct_module_node: function (module_id) {
      var $this = this;
      var modules = this.modules;
      var module = modules[module_id];
      var className = '';
      className += 'running';

      var is_overflowing = false;

      if (module.capacity != null && module.input_throughput > module.capacity) {
        className += ' warn';
        is_overflowing = true;
      }

      if(module.tunnel)
      {
        className += ' tunnel';
      }

      var throughput = module.input_throughput;
      var throughput_label = formatIntOrFloat(throughput) + $this.unit;

      var module_capacity_label = module.capacity ? 
        'Capacity:' +  formatIntOrFloat(module.capacity) + $this.unit : '';

      var capacity_factor_label = '';

      if(module.capacity != null)
      {
        '<span class="capacity-factor ' + (is_overflowing ? 'capacity-overflow' : '') + '">'
         + module.input_throughput + '/' + module.capacity + '</span>';
      }

      var html = '';    

      html += '<div class="node-header">';

      html += '<span class="status"></span>';
      html += '<span class="name" >' + module_id + '</span>';
      html += '<span class="meter"><span class="throughput">' + throughput_label + '</span></span>';

      html += '</div>';

      if(module.services)
      {
        className += ' services';

        html += '<ul class="service-list">';

        for(var service in module.services)
        {
          html += '<li>' + service + ' * ' + module.services[service] + '</li>';
        }

        html += '</ul>';
      }

      //html += '</div>';

      var description = module_capacity_label;

      return {
          id: module_id,
          value: {
          label: html,
          className: className,
          rank: module.layer != null ? 'same_' + module.layer : '',
          description: description
        }
      };
  },
  construct_call_edge: function (caller_id, callee_id, throughput, factor, call_group) {

      var $this = this;
      var modules = this.modules;
      var meta = this.meta;

      // console.log(modules[callee_id].input_throughput, throughput,
      //   modules[callee_id].throughput == throughput);

      var only_call_edge = 
        modules[callee_id].input_throughput == throughput &&
        !modules[caller_id].tunnel ;

      call_group = call_group || null;

      var throughput_label = '';

      if(!only_call_edge || !meta.hide_throughput_for_only_call_edge)
      {
        throughput_label = formatIntOrFloat(throughput);

        throughput_label = '<span class="edge-throughput" >' 
          + throughput_label + $this.unit + '</span>';        
      }

      var factor_label = '';
      var factor_tip = '';      

      if(typeof factor == "number" && factor != 1)
      {
        factor_tip = formatIntOrFloat(factor * 100) + '%';
        factor_label = '<div>' + (only_call_edge ? '' : '(') + '<span class="edge-factor">'
        + formatIntOrFloat(factor) 
        + '/1</span><span>' + factor_tip 
        + '</span>' + (only_call_edge? '' : ')') + '</div>';
      }      

      var label = throughput_label + factor_label;
      
      var edge_spec = {
        u: caller_id, 
        v: callee_id, 
        value: {
          'label': label,
          'u': caller_id, 
          'v': callee_id,
          'factor': factor,
          'call_group': call_group,
          'only_call_edge': only_call_edge
        }
      };

      console.log(edge_spec);

      return edge_spec;
  },
  draw: function (isUpdate) {
    var nodes = [];
    var edges = [];

    var layers = {};
    var tunnels = {};

    var modules = this.modules;
    var meta = this.meta;
    var zoom = this.zoom;

    var $this = this;

    var calc_factor = function (factor) {

      if(typeof factor == "string" && /[0-9.+\-*\/\(\) ]+/.test(factor))
      {
        return eval(factor) || 1;
      }
      else if(typeof factor == "number")
      {
        return factor;
      }
      else
      {
        return 1;
      }

    };

    //preprocess    
    _.forOwn(modules, function (module, module_id) {

      // register modules to corresponding layers
      // to calculate input_throughput in order
      if(module.layer)
      {
        layers[module.layer] = layers[module.layer] || [];

        layers[module.layer].push(module_id);

        if(module.layer != 0)
        {
          module.input_throughput = 0;
        } 
      }

      if(module.tunnel)
      {
        //console.log(module_id, module);
        module.input_throughput = 0;     
      }
      
      if (module.calls) {
        for(var callee_id in module.calls)
        {
          if(modules[callee_id])
          {
            var callee_module = modules[callee_id];

            //calculate every modules' callers
            callee_module['callers'] = callee_module['callers'] || {};

            callee_module['callers'][module_id] = {};

            //aggregate services of callee modules
            //TODO when to clear?

            if(module.calls[callee_id].services)
            {
              callee_module['services'] = callee_module['services'] || {};

              for(var callee_service in module.calls[callee_id].services)
              {
                callee_module['services'][callee_service] = 
                module.calls[callee_id].services[callee_service] || 1;

                //console.log(callee_id, callee_service);
              }
            }

            //aggregate tunnels
            if(module.calls[callee_id].tunnel)
            {
              var tunnel_id = module.calls[callee_id].tunnel;

               // add both side of the tunnel call 
              tunnels[tunnel_id] = tunnels[tunnel_id] || {}; 

              tunnels[tunnel_id][module_id] = 
                tunnels[tunnel_id][module_id] || [];

              tunnels[tunnel_id][module_id].push(callee_id);
            }
          }
        }
      }
    });

    //layer_ids must be in ASCII order
    //so the input_throughput won't be calculated wrong
    _.forOwn(layers, function (layer, layer_id) {

      _.forEach(layer, function (module_id) {

        var module = modules[module_id];

        _.forOwn(module.callers, function (__ignored, caller_id) {

          var caller = modules[caller_id];

          if(caller && caller.input_throughput != null && caller.calls)
          {
            var callee = caller.calls[module_id] || {};
            var factor = calc_factor(callee.factor); 

            module.input_throughput += caller.input_throughput * factor * calc_service_call_count(callee);

            // console.log(module_id, 'called by', caller_id, 
            //   '+', caller.input_throughput, '*', factor, '=', 
            //   module.input_throughput);
          }
          else
          {
            console.log(module_id, 'called by', caller_id, 'but not summed', caller);
          }
        });        
      });
    });

    _.forOwn(modules, function (module, module_id) {

      if(!module.tunnel)
      {
        nodes.push($this.construct_module_node(module_id));
      }

      if (module.calls) {

         _.forOwn(module.calls, function (callee_properties, callee) {
          
          if(modules[callee])
          {
            var callee_module = modules[callee];

            //console.log(callee, callee_module.layer);

            callee_properties = callee_properties || {};

            if(!module.tunnel &&!callee_properties.tunnel)
            {
              var factor = calc_factor(callee_properties.factor);

              var throughput = 
                (module.input_throughput * factor * calc_service_call_count(callee_properties));

              edges.push($this.construct_call_edge(module_id, callee, throughput, factor));
            }
          }

        });
      }
    });

    _.forOwn(tunnels, function (tunnel_users, tunnel_id) {

      var tunnel_module = modules[tunnel_id];

      tunnel_module.input_throughput = tunnel_module.input_throughput || 0;

      //console.log(tunnel_id, tunnel_users);

      var tunnel_edges = [];

      _.forOwn(tunnel_users, function (callee_ids, caller_id) {
        var caller_module = modules[caller_id];
        var caller_tunnel_throughput = 0;

        _.forEach(callee_ids, function (callee_id) {

          var callee_properties = caller_module.calls[callee_id] || {};
          var callee_module = modules[callee_id] || {};

          //console.log(tunnel_id, caller_id, callee_ids, callee_module, callee_properties);

          var factor = calc_factor(callee_properties.factor);
          var ouputThroughput = (caller_module.input_throughput || 0) * factor * calc_service_call_count(callee_properties);

          tunnel_module.input_throughput += ouputThroughput;
          caller_tunnel_throughput += ouputThroughput;

          var throughput = ouputThroughput;

          var call_edges = $this.construct_call_edge(tunnel_id, callee_id, throughput, factor, caller_id + '-' + tunnel_id );

          edges.push(call_edges);
        });

        var throughput = (caller_tunnel_throughput || 0);

        // the factor for tunnel is always 1
        edges.push($this.construct_call_edge(caller_id, tunnel_id, throughput, 1, caller_id + '-' + tunnel_id));
      });

      nodes.push($this.construct_module_node(tunnel_id));

    });

    var renderer = new dagreD3.Renderer();
    var svg = d3.select("svg");

    // Extend drawNodes function to set custom ID and class on nodes
    var oldDrawNodes = renderer.drawNodes();
    renderer.drawNodes(function(graph, root) {
      var svgNodes = oldDrawNodes(graph, root);
      svgNodes.attr("id", function(u) { return "node-" + u; });
      svgNodes.attr("class", function(u) { return "node " + graph.node(u).className; });

      svgNodes.each(function (u) {

        var desc = graph.node(u).description;

        var meter = $('.meter', this);

        meter.attr('title', desc).tipsy({ gravity: 'w', opacity: 1 });

      });

      return svgNodes;
    });

    var oldDrawEdgePaths = renderer.drawEdgePaths();

    renderer.drawEdgePaths(function (graph, root) {
      var svgEdgePaths = oldDrawEdgePaths(graph, root);

      svgEdgePaths.attr("id", function(e) {
        var edge = graph.edge(e);
        return ("" + edge.u + '-' + edge.v);
      });

      svgEdgePaths.selectAll("path").style({'stroke': function (e) {
        var edge = graph.edge(e);
        //console.log(edge);
        return edge.call_group == null ? 
          '#999' : uniq_color(edge.call_group);
      }});

      return svgEdgePaths;
    });

    var oldDrawEdgeLabels = renderer.drawEdgeLabels();

    renderer.drawEdgeLabels(function (graph, root) {
      var svgEdgeLabels = oldDrawEdgeLabels(graph, root);

      // svgEdgeLabels.attr("dummy", function(e) {
      //   var edge = graph.edge(e);
      //   console.log(edge);
      // });

      var labels = svgEdgeLabels.selectAll(".edge-factor");

      console.log(labels);

      labels.each(function () {
        $(this).peity("pie", {
          diameter: 14,
          fill: ["orange", "#eeeeee"]
        });
      });

      return svgEdgeLabels;
    });

    // Custom transition function
    function transition(selection) {
      return selection.transition().duration(500);
    }
    isUpdate && renderer.transition(transition);

    renderer.zoom(function (graph, svg) {
      return zoom.on('zoom', function() {
        svg.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
      });
    });

    // Left-to-right layout
    var layout = dagreD3.layout()
      .nodeSep(meta["nodeSep"] || 70)
      .edgeSep(meta["edgeSep"] || 70)
      .rankSep(meta["rankSep"] || 50)
      .rankDir(meta["rankDir"] || "LR");
    var renderedLayout = renderer
      .layout(layout)
      .run(dagreD3.json.decode(nodes, edges), d3.select("svg g"));

    // Zoom and scale to fit
    var zoomScale = zoom.scale();
    var graphWidth = renderedLayout.graph().width + 80;
    var graphHeight = renderedLayout.graph().height + 40;
    var width = parseInt(svg.style('width').replace(/px/, ''));
    var height = parseInt(svg.style('height').replace(/px/, ''));    
    var translate = zoom.translate();

    if(!isUpdate)
    {
      zoomScale = Math.min(width / graphWidth, height / graphHeight);
      translate = [(width/2) - ((graphWidth*zoomScale)/2), (height/2) - ((graphHeight*zoomScale)/2)];
    }

    zoom.translate(translate);
    zoom.scale(zoomScale);
    zoom.event(isUpdate ? svg.transition().duration(500) : d3.select('svg'));
  },
  get_modules: function () {
    return this.modules;
  },
  get_meta: function () {
    return this.meta;
  }
};