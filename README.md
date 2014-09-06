river-net
=========

A Javascript network graph renderer that presents the call chains, data flows in it, easing the process to find the bottlenecks in the system.

Rationale
------------------

To ease the process to find the bottlenecks in the system, river-net presents call chains and data flow in a network of modules and satisfies the following needs:

* Auto layout like in [Graphviz Dot](http://www.graphviz.org/) but remains customizable
* The presentation should please the eye
* When many modules are calling and being called by each other, the graph shouldn't become messy. Specify a module, then one should easily tell what modules are called by or calling it.
* Should consider the complications, see Section [Complications](#complications), automatically calculate the amount of flows and bottlenecks based on it.

river-net is built based on [dagre-d3](https://github.com/cpettitt/dagre-d3), which uses [d3](https://github.com/mbostock/d3) as renderer, rendering the graph to SVG .

The current implementation is inspired by [ETL Visualization](http://cpettitt.github.io/project/dagre-d3/latest/demo/etl-status.html), which is an example of dagre-d3 .

Complications
---------------

Let's say we have a network of __modules__. Triggered by a __business process__, one __original module__ has been called, then it will call a few modules to complete the mission, this is the __call chain__.

The following is an example of a call chain:

![](https://github.com/utensil/river-net/raw/master/doc/img/sample1.png)

Give the __input throughput__ of A, we need to know the input throughput of every module and whether it's above its capacity, so we can find the bottlenecks of the system.

In the example above, when A(the __original module__) is called once, E is called twice. This is not a waste, because C and D are calling E for different __services__ . This happens in real day-to-day system design.

In some cases, when B is called once, C and D are not called once each, but weighted: C is called twice for different services, and D is conditionally called, so about 6% of B-calls will trigger D-calls, but what's more, when the condition is met, D is called by B not only once but 3 times, so we have:

![](https://github.com/utensil/river-net/raw/master/doc/img/sample2.png)

These are the first series of complications that river-net takes into account, and it will render something like:

![](https://github.com/utensil/river-net/raw/master/doc/img/sample3.png)

The json to generate the above diagram is [here](https://github.com/utensil/river-net/raw/master/samples/sample3.json).

Now let's take one step further. What if C and D doesn't call E, F and G directly, but has to go through a tunnel, then the input throughput of the tunnel is the sum of all input throughputs to E, F and G, and it could also become a bottleneck.

Taking these into account, we have something like:

![](https://github.com/utensil/river-net/raw/master/doc/img/sample4.png)

The json to generate the above diagram is [here](https://github.com/utensil/river-net/raw/master/samples/sample4.json).

While C-F, C-E, D-E, D-G all go through the tunnel, the diagram colors the calls from the different origins with different colors, so it's easily distinguishable. The colors are chosen from the colors in [unique-colors](https://github.com/federicospini/unique-colors).

Development Status
-----------------------------

Early stage. 

API
--------------

For now, river-net uses a json to describe the network. But we should have an API soon, preferably a chaining style one.

Dependencies
----------------

Essential:

* [dagre-d3](https://github.com/cpettitt/dagre-d3)
    - [graphlib](https://github.com/cpettitt/graphlib): bundled in dagre-d3
    - [d3](https://github.com/mbostock/d3)
* [jquery](https://github.com/jquery/jquery)
* [lodash](https://github.com/lodash/lodash)

Should be made optional:

* [peity](https://github.com/benpickles/peity)
* [tipsy](https://github.com/jaz303/tipsy)

Installation
--------------

Coming soon.

License
------------

MIT License, see LICENSE. Copyright (c) 2014 Utensil Song (https://github.com/utensil)
