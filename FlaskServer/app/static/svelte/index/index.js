
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var indexApp = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function debug(file, line, column, values) {
        console.log(`{@debug} ${file ? file + ' ' : ''}(${line}:${column})`); // eslint-disable-line no-console
        console.log(values); // eslint-disable-line no-console
        return '';
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* app\static\svelte\svg\Check.svelte generated by Svelte v3.59.2 */

    const file$2 = "app\\static\\svelte\\svg\\Check.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z");
    			add_location(path, file$2, 2, 4, 119);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "20px");
    			attr_dev(svg, "viewBox", "0 -960 960 960");
    			attr_dev(svg, "width", "20px");
    			attr_dev(svg, "fill", "#ffffff");
    			add_location(svg, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Check', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Check> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Check extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Check",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* app\static\svelte\svg\Cross.svelte generated by Svelte v3.59.2 */

    const file$1 = "app\\static\\svelte\\svg\\Cross.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z");
    			add_location(path, file$1, 6, 4, 140);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "20px");
    			attr_dev(svg, "viewBox", "0 -960 960 960");
    			attr_dev(svg, "width", "20px");
    			attr_dev(svg, "fill", "#FFF");
    			add_location(svg, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Cross', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Cross> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Cross extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cross",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    function fileDrop(event, updateImage) {

        const files = event.target.files;
        
        try{
          if(files.length > 1){
            throw new Error("Upload only one file");
          }
          if(!files[0].type.startsWith('image/')){
            throw new Error("Upload only image files");
          }
          const reader = new FileReader();
          reader.onload = () => {
            var dataURL = reader.result;
            updateImage(dataURL);
          };
          reader.readAsDataURL(files[0]);
        }
        catch(err){
          console.error(err);
        }
      }

    /* app\svelte\index\App.svelte generated by Svelte v3.59.2 */

    const file = "app\\svelte\\index\\App.svelte";

    // (80:4) {#if dropdowns.season}
    function create_if_block_10(ctx) {
    	let ul;
    	let li0;
    	let button0;
    	let t0;
    	let t1;
    	let li1;
    	let button1;
    	let t2;
    	let t3;
    	let li2;
    	let button2;
    	let t4;
    	let t5;
    	let li3;
    	let button3;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$seasons*/ ctx[2].spring && create_if_block_14(ctx);
    	let if_block1 = /*$seasons*/ ctx[2].summer && create_if_block_13(ctx);
    	let if_block2 = /*$seasons*/ ctx[2].fall && create_if_block_12(ctx);
    	let if_block3 = /*$seasons*/ ctx[2].winter && create_if_block_11(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			t0 = text("Spring");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			t2 = text("Summer");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			t4 = text("Fall");
    			if (if_block2) if_block2.c();
    			t5 = space();
    			li3 = element("li");
    			button3 = element("button");
    			t6 = text("Winter");
    			if (if_block3) if_block3.c();
    			attr_dev(button0, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 81, 23, 2373);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 81, 6, 2356);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 82, 23, 2616);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 82, 6, 2599);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 83, 23, 2859);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 83, 6, 2842);
    			attr_dev(button3, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button3, file, 84, 23, 3096);
    			attr_dev(li3, "class", "ml-8");
    			add_location(li3, file, 84, 6, 3079);
    			add_location(ul, file, 80, 5, 2344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(button0, t0);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(button1, t2);
    			if (if_block1) if_block1.m(button1, null);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(button2, t4);
    			if (if_block2) if_block2.m(button2, null);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(li3, button3);
    			append_dev(button3, t6);
    			if (if_block3) if_block3.m(button3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[11], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[12], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[13], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_4*/ ctx[14], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$seasons*/ ctx[2].spring) {
    				if (if_block0) {
    					if (dirty & /*$seasons*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_14(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$seasons*/ ctx[2].summer) {
    				if (if_block1) {
    					if (dirty & /*$seasons*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_13(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$seasons*/ ctx[2].fall) {
    				if (if_block2) {
    					if (dirty & /*$seasons*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_12(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(button2, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*$seasons*/ ctx[2].winter) {
    				if (if_block3) {
    					if (dirty & /*$seasons*/ 4) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_11(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(button3, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(80:4) {#if dropdowns.season}",
    		ctx
    	});

    	return block;
    }

    // (82:193) {#if $seasons.spring}
    function create_if_block_14(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(82:193) {#if $seasons.spring}",
    		ctx
    	});

    	return block;
    }

    // (83:193) {#if $seasons.summer}
    function create_if_block_13(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(83:193) {#if $seasons.summer}",
    		ctx
    	});

    	return block;
    }

    // (84:189) {#if $seasons.fall}
    function create_if_block_12(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(84:189) {#if $seasons.fall}",
    		ctx
    	});

    	return block;
    }

    // (85:193) {#if $seasons.winter}
    function create_if_block_11(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(85:193) {#if $seasons.winter}",
    		ctx
    	});

    	return block;
    }

    // (96:4) {#if dropdowns.holiday}
    function create_if_block_6(ctx) {
    	let ul;
    	let li0;
    	let button0;
    	let t0;
    	let t1;
    	let li1;
    	let button1;
    	let t2;
    	let t3;
    	let li2;
    	let button2;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$holiday*/ ctx[3].easter && create_if_block_9(ctx);
    	let if_block1 = /*$holiday*/ ctx[3].thanksgiving && create_if_block_8(ctx);
    	let if_block2 = /*$holiday*/ ctx[3].christmas && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			t0 = text("Easter");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			t2 = text("Thanksgiving");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			t4 = text("Christmas");
    			if (if_block2) if_block2.c();
    			attr_dev(button0, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 97, 23, 3915);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 97, 6, 3898);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 98, 23, 4158);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 98, 6, 4141);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 99, 23, 4419);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 99, 6, 4402);
    			add_location(ul, file, 96, 5, 3886);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(button0, t0);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(button1, t2);
    			if (if_block1) if_block1.m(button1, null);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(button2, t4);
    			if (if_block2) if_block2.m(button2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_6*/ ctx[16], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_7*/ ctx[17], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_8*/ ctx[18], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$holiday*/ ctx[3].easter) {
    				if (if_block0) {
    					if (dirty & /*$holiday*/ 8) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$holiday*/ ctx[3].thanksgiving) {
    				if (if_block1) {
    					if (dirty & /*$holiday*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_8(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$holiday*/ ctx[3].christmas) {
    				if (if_block2) {
    					if (dirty & /*$holiday*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_7(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(button2, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(96:4) {#if dropdowns.holiday}",
    		ctx
    	});

    	return block;
    }

    // (98:193) {#if $holiday.easter}
    function create_if_block_9(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(98:193) {#if $holiday.easter}",
    		ctx
    	});

    	return block;
    }

    // (99:205) {#if $holiday.thanksgiving}
    function create_if_block_8(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(99:205) {#if $holiday.thanksgiving}",
    		ctx
    	});

    	return block;
    }

    // (100:199) {#if $holiday.christmas}
    function create_if_block_7(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(100:199) {#if $holiday.christmas}",
    		ctx
    	});

    	return block;
    }

    // (111:4) {#if dropdowns.style}
    function create_if_block_2(ctx) {
    	let ul;
    	let li0;
    	let button0;
    	let t0;
    	let t1;
    	let li1;
    	let button1;
    	let t2;
    	let t3;
    	let li2;
    	let button2;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$style*/ ctx[4].modern && create_if_block_5(ctx);
    	let if_block1 = /*$style*/ ctx[4].old && create_if_block_4(ctx);
    	let if_block2 = /*$style*/ ctx[4].trash && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			t0 = text("Modern");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			t2 = text("Old");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			t4 = text("Trash");
    			if (if_block2) if_block2.c();
    			attr_dev(button0, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 112, 23, 5240);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 112, 6, 5223);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 113, 23, 5479);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 113, 6, 5462);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 114, 23, 5709);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 114, 6, 5692);
    			add_location(ul, file, 111, 5, 5211);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(button0, t0);
    			if (if_block0) if_block0.m(button0, null);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(button1, t2);
    			if (if_block1) if_block1.m(button1, null);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(button2, t4);
    			if (if_block2) if_block2.m(button2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_10*/ ctx[20], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_11*/ ctx[21], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_12*/ ctx[22], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$style*/ ctx[4].modern) {
    				if (if_block0) {
    					if (dirty & /*$style*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$style*/ ctx[4].old) {
    				if (if_block1) {
    					if (dirty & /*$style*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$style*/ ctx[4].trash) {
    				if (if_block2) {
    					if (dirty & /*$style*/ 16) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(button2, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(111:4) {#if dropdowns.style}",
    		ctx
    	});

    	return block;
    }

    // (113:191) {#if $style.modern}
    function create_if_block_5(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(113:191) {#if $style.modern}",
    		ctx
    	});

    	return block;
    }

    // (114:185) {#if $style.old}
    function create_if_block_4(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(114:185) {#if $style.old}",
    		ctx
    	});

    	return block;
    }

    // (115:189) {#if $style.trash}
    function create_if_block_3(ctx) {
    	let check;
    	let current;
    	check = new Check({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(check.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(check, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(check.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(check.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(check, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(115:189) {#if $style.trash}",
    		ctx
    	});

    	return block;
    }

    // (130:4) {#if dropdowns.cfg}
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Nothing here yet.";
    			add_location(p, file, 131, 6, 6606);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(130:4) {#if dropdowns.cfg}",
    		ctx
    	});

    	return block;
    }

    // (143:3) {:else}
    function create_else_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*imageSrc*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "max-w-xs h-auto object-contain");
    			attr_dev(img, "id", "output");
    			set_style(img, "display", "block");
    			attr_dev(img, "alt", "Uploaded_image");
    			add_location(img, file, 143, 4, 7145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageSrc*/ 1 && !src_url_equal(img.src, img_src_value = /*imageSrc*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(143:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (140:3) {#if !imageSrc}
    function create_if_block(ctx) {
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Click to add image";
    			t1 = space();
    			p = element("p");
    			p.textContent = "The image should contain your product with a white background";
    			attr_dev(h1, "class", "text-3xl text-red-500 font-bold tracking-tight text-center mb-5");
    			add_location(h1, file, 140, 4, 6938);
    			attr_dev(p, "class", "text-xs");
    			add_location(p, file, 141, 4, 7043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(140:3) {#if !imageSrc}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let nav;
    	let h1;
    	let t1;
    	let ul0;
    	let li0;
    	let button0;
    	let t2;
    	let svg0;
    	let path0;
    	let t3;
    	let t4;
    	let li1;
    	let button1;
    	let t5;
    	let svg1;
    	let path1;
    	let t6;
    	let t7;
    	let li2;
    	let button2;
    	let t8;
    	let svg2;
    	let path2;
    	let t9;
    	let t10;
    	let p;
    	let t12;
    	let ul1;
    	let li3;
    	let button3;
    	let t13;
    	let svg3;
    	let path3;
    	let t14;
    	let t15;
    	let main;
    	let label;
    	let t16;
    	let input;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*dropdowns*/ ctx[1].season && create_if_block_10(ctx);
    	let if_block1 = /*dropdowns*/ ctx[1].holiday && create_if_block_6(ctx);
    	let if_block2 = /*dropdowns*/ ctx[1].style && create_if_block_2(ctx);
    	let if_block3 = /*dropdowns*/ ctx[1].cfg && create_if_block_1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (!/*imageSrc*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block4 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			nav = element("nav");
    			h1 = element("h1");
    			h1.textContent = "KRAFT";
    			t1 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			t2 = text("Season\r\n\t\t\t\t\t");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			li1 = element("li");
    			button1 = element("button");
    			t5 = text("Holiday\r\n\t\t\t\t\t");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			li2 = element("li");
    			button2 = element("button");
    			t8 = text("Style\r\n\t\t\t\t\t");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			p = element("p");
    			p.textContent = "Custom Settings";
    			t12 = space();
    			ul1 = element("ul");
    			li3 = element("li");
    			button3 = element("button");
    			t13 = text("CFG\r\n\t\t\t\t\t");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t14 = space();
    			if (if_block3) if_block3.c();
    			t15 = space();
    			main = element("main");
    			label = element("label");
    			if_block4.c();
    			t16 = space();
    			input = element("input");
    			attr_dev(h1, "class", "p-2 text-5xl font-title tracking-widest font-bold");
    			add_location(h1, file, 71, 2, 1719);
    			attr_dev(path0, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path0, file, 77, 211, 2225);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "height", "16px");
    			attr_dev(svg0, "viewBox", "0 -960 960 960");
    			attr_dev(svg0, "width", "16px");
    			attr_dev(svg0, "fill", "#ffffff");
    			set_style(svg0, "transform", "rotate(" + (/*dropdowns*/ ctx[1].season ? '90deg' : '0deg') + ")");
    			set_style(svg0, "transition", "transform 0.3s ease");
    			add_location(svg0, file, 77, 5, 2019);
    			attr_dev(button0, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 75, 4, 1847);
    			add_location(li0, file, 74, 3, 1837);
    			attr_dev(path1, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path1, file, 93, 212, 3766);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "height", "16px");
    			attr_dev(svg1, "viewBox", "0 -960 960 960");
    			attr_dev(svg1, "width", "16px");
    			attr_dev(svg1, "fill", "#ffffff");
    			set_style(svg1, "transform", "rotate(" + (/*dropdowns*/ ctx[1].holiday ? '90deg' : '0deg') + ")");
    			set_style(svg1, "transition", "transform 0.3s ease");
    			add_location(svg1, file, 93, 5, 3559);
    			attr_dev(button1, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 91, 4, 3385);
    			add_location(li1, file, 90, 3, 3375);
    			attr_dev(path2, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path2, file, 108, 210, 5093);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "height", "16px");
    			attr_dev(svg2, "viewBox", "0 -960 960 960");
    			attr_dev(svg2, "width", "16px");
    			attr_dev(svg2, "fill", "#ffffff");
    			set_style(svg2, "transform", "rotate(" + (/*dropdowns*/ ctx[1].style ? '90deg' : '0deg') + ")");
    			set_style(svg2, "transition", "transform 0.3s ease");
    			add_location(svg2, file, 108, 5, 4888);
    			attr_dev(button2, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 106, 4, 4718);
    			add_location(li2, file, 105, 3, 4708);
    			attr_dev(ul0, "class", "mt-8");
    			add_location(ul0, file, 72, 2, 1795);
    			attr_dev(p, "class", "text-left p-2 mt-8");
    			add_location(p, file, 121, 2, 5996);
    			attr_dev(path3, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path3, file, 127, 208, 6454);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "height", "16px");
    			attr_dev(svg3, "viewBox", "0 -960 960 960");
    			attr_dev(svg3, "width", "16px");
    			attr_dev(svg3, "fill", "#ffffff");
    			set_style(svg3, "transform", "rotate(" + (/*dropdowns*/ ctx[1].cfg ? '90deg' : '0deg') + ")");
    			set_style(svg3, "transition", "transform 0.3s ease");
    			add_location(svg3, file, 127, 5, 6251);
    			attr_dev(button3, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button3, file, 125, 4, 6085);
    			add_location(li3, file, 124, 3, 6075);
    			add_location(ul1, file, 122, 2, 6049);
    			attr_dev(nav, "class", "w-1/5 min-h-max bg-dark-200 text-white p-4 text-base border-r text-center");
    			add_location(nav, file, 70, 1, 1628);
    			attr_dev(label, "for", "filepicker");
    			attr_dev(label, "class", "px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100 cursor-pointer");
    			add_location(label, file, 138, 2, 6769);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "accept", "image/**");
    			attr_dev(input, "id", "filepicker");
    			set_style(input, "display", "none");
    			add_location(input, file, 146, 2, 7288);
    			attr_dev(main, "class", "flex items-center justify-center h-full w-full bg-black text-white font-body");
    			add_location(main, file, 137, 1, 6674);
    			attr_dev(div, "class", "flex h-screen max-w-screen");
    			add_location(div, file, 69, 0, 1585);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, nav);
    			append_dev(nav, h1);
    			append_dev(nav, t1);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, button0);
    			append_dev(button0, t2);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(li0, t3);
    			if (if_block0) if_block0.m(li0, null);
    			append_dev(ul0, t4);
    			append_dev(ul0, li1);
    			append_dev(li1, button1);
    			append_dev(button1, t5);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(li1, t6);
    			if (if_block1) if_block1.m(li1, null);
    			append_dev(ul0, t7);
    			append_dev(ul0, li2);
    			append_dev(li2, button2);
    			append_dev(button2, t8);
    			append_dev(button2, svg2);
    			append_dev(svg2, path2);
    			append_dev(li2, t9);
    			if (if_block2) if_block2.m(li2, null);
    			append_dev(nav, t10);
    			append_dev(nav, p);
    			append_dev(nav, t12);
    			append_dev(nav, ul1);
    			append_dev(ul1, li3);
    			append_dev(li3, button3);
    			append_dev(button3, t13);
    			append_dev(button3, svg3);
    			append_dev(svg3, path3);
    			append_dev(li3, t14);
    			if (if_block3) if_block3.m(li3, null);
    			append_dev(div, t15);
    			append_dev(div, main);
    			append_dev(main, label);
    			if_block4.m(label, null);
    			append_dev(main, t16);
    			append_dev(main, input);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[10], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[15], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_9*/ ctx[19], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_13*/ ctx[23], false, false, false, false),
    					listen_dev(input, "change", /*handleFileDrop*/ ctx[9], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*dropdowns*/ 2) {
    				set_style(svg0, "transform", "rotate(" + (/*dropdowns*/ ctx[1].season ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[1].season) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*dropdowns*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(li0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*dropdowns*/ 2) {
    				set_style(svg1, "transform", "rotate(" + (/*dropdowns*/ ctx[1].holiday ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[1].holiday) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*dropdowns*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(li1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*dropdowns*/ 2) {
    				set_style(svg2, "transform", "rotate(" + (/*dropdowns*/ ctx[1].style ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[1].style) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*dropdowns*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(li2, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*dropdowns*/ 2) {
    				set_style(svg3, "transform", "rotate(" + (/*dropdowns*/ ctx[1].cfg ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[1].cfg) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					if_block3.m(li3, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block4) {
    				if_block4.p(ctx, dirty);
    			} else {
    				if_block4.d(1);
    				if_block4 = current_block_type(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(label, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if_block4.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function setTrue(store, key) {
    	store.update(map => {
    		// If the current key is already true, set all values to false
    		if (map[key] === true) {
    			for (let k in map) {
    				map[k] = false;
    			}

    			return map; // Return updated map with all false
    		}

    		// Otherwise, set all to false, and the specified key to true
    		for (let k in map) {
    			map[k] = false;
    		}

    		map[key] = true;
    		return map; // Return updated map
    	});
    }

    function instance($$self, $$props, $$invalidate) {
    	let $seasons;
    	let $holiday;
    	let $style;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let imageSrc = '';

    	let dropdowns = {
    		season: false,
    		holiday: false,
    		style: false,
    		cfg: false
    	};

    	function toggleDropdown(key) {
    		$$invalidate(1, dropdowns[key] = !dropdowns[key], dropdowns);
    	}

    	// All categories
    	let seasons = writable({
    		spring: false,
    		summer: false,
    		fall: false,
    		winter: false
    	});

    	validate_store(seasons, 'seasons');
    	component_subscribe($$self, seasons, value => $$invalidate(2, $seasons = value));

    	let holiday = writable({
    		easter: false,
    		thanksgiving: false,
    		christmas: false
    	});

    	validate_store(holiday, 'holiday');
    	component_subscribe($$self, holiday, value => $$invalidate(3, $holiday = value));
    	let style = writable({ modern: false, old: false, trash: false });
    	validate_store(style, 'style');
    	component_subscribe($$self, style, value => $$invalidate(4, $style = value));

    	function handleFileDrop(event) {
    		fileDrop(event, src => $$invalidate(0, imageSrc = src)); //
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toggleDropdown('season');
    	const click_handler_1 = () => setTrue(seasons, 'spring');
    	const click_handler_2 = () => setTrue(seasons, 'summer');
    	const click_handler_3 = () => setTrue(seasons, 'fall');
    	const click_handler_4 = () => setTrue(seasons, 'winter');
    	const click_handler_5 = () => toggleDropdown('holiday');
    	const click_handler_6 = () => setTrue(holiday, 'easter');
    	const click_handler_7 = () => setTrue(holiday, 'thanksgiving');
    	const click_handler_8 = () => setTrue(holiday, 'christmas');
    	const click_handler_9 = () => toggleDropdown('style');
    	const click_handler_10 = () => setTrue(style, 'modern');
    	const click_handler_11 = () => setTrue(style, 'old');
    	const click_handler_12 = () => setTrue(style, 'trash');
    	const click_handler_13 = () => toggleDropdown('cfg');

    	$$self.$capture_state = () => ({
    		debug,
    		writable,
    		Check,
    		Cross,
    		fileDrop,
    		imageSrc,
    		dropdowns,
    		toggleDropdown,
    		seasons,
    		holiday,
    		style,
    		setTrue,
    		handleFileDrop,
    		$seasons,
    		$holiday,
    		$style
    	});

    	$$self.$inject_state = $$props => {
    		if ('imageSrc' in $$props) $$invalidate(0, imageSrc = $$props.imageSrc);
    		if ('dropdowns' in $$props) $$invalidate(1, dropdowns = $$props.dropdowns);
    		if ('seasons' in $$props) $$invalidate(6, seasons = $$props.seasons);
    		if ('holiday' in $$props) $$invalidate(7, holiday = $$props.holiday);
    		if ('style' in $$props) $$invalidate(8, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		imageSrc,
    		dropdowns,
    		$seasons,
    		$holiday,
    		$style,
    		toggleDropdown,
    		seasons,
    		holiday,
    		style,
    		handleFileDrop,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		click_handler_13
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		greetings: 'Hello'
    	}
    });

    return app;

})();
//# sourceMappingURL=index.js.map
