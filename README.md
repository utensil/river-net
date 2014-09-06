river-net
=========

A Javascript network graph renderer that also presents the call chains and data flow in it.

Rationale
------------------

The initial intention is to present call chains and data flow in a network of modules and satisfying the following needs:

* Auto layout like in [Graphviz Dot](http://www.graphviz.org/) but remains customizable
* The presentation should please the eye
* When many modules are calling and being called by each other, the graph shouldn't become messy. Specify a module, then one should easily tell what modules are called by or calling it.
* Should consider the complications, see Section [Complications](#complications), automatically calculate the amount of flow based on it.

river-net is built based on [dagre-d3](https://github.com/cpettitt/dagre-d3), which uses [d3](https://github.com/mbostock/d3) as renderer, rendering the graph to SVG .

The current implementation is inspired by [ETL Visualization](http://cpettitt.github.io/project/dagre-d3/latest/demo/etl-status.html), which is an example of dagre-d3 .

Complications
---------------

Let's say we have a network of __modules__. Due to a __business process__, one __original module__ has been called, then it will call a few modules to complete the mission, this is the __call chain__.

The following is an example of a call chain:

![](https://github.com/utensil/river-net/raw/master/doc/img/sample1.png)

In the example above, when A(the __original module__) is called once, E is called twice. This is not a waste, because C and D are calling E for different __services__ . This happens in real day-to-day system design.

In some cases, when B is called once, C and D are not called once each, but weighted: C is called twice for different services, and D is conditionally called, so about 6% of B-calls will trigger D-calls, but what's more, when the condition is met, D is called by B not only once but 3 times, so we have:

![](https://github.com/utensil/river-net/raw/master/doc/img/sample2.png)

Give the __input throughput__ of A, we need to know the input throughput of every module and whether it's above its capacity.

These are the complications that river-net takes into account, and it will render something like:

![](https://github.com/utensil/river-net/raw/master/doc/img/sample3.png)

The json to generate the above image is [here](https://github.com/utensil/river-net/raw/master/samples/sample3.json).

Development Status
-----------------------------

Early stage. 

Dependencies
----------------

Coming soon.

Installation
--------------

Coming soon.

License
------------

MIT License, see LICENSE. Copyright (c) 2014 Utensil Song (https://github.com/utensil)
