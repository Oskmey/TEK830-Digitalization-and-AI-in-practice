
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
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
    function empty() {
        return text('');
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    // In your file.js
    function fileDrop(event, updateImage) {
      const files = event.target.files;

      try {
          const file = files[0]; 
          updateImage(file);

          const reader = new FileReader();
          reader.onload = () => {
              var dataURL = reader.result;
              updateImage(dataURL, file);
          };
          reader.readAsDataURL(file);
      } catch (err) {
          console.error(err);
      }
    }

    function uploadImage(image, promt="cute squirrel", sampler = "Euler a", steps = 20, cfg_scale=7.0, denoising_strength = 0.6) {
        const formData = new FormData();

        formData.append('image', image);
        formData.append('promt', promt);
        formData.append('sampler', sampler);
        formData.append('steps', steps);
        formData.append('cfg_scale', cfg_scale);
        formData.append('denoising_strength', denoising_strength);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if(!response.ok){
                throw new Error('Network response was not ok');
            }
        });
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
    			attr_dev(svg, "height", "24px");
    			attr_dev(svg, "viewBox", "0 -960 960 960");
    			attr_dev(svg, "width", "24px");
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

    /* app\svelte\index\App.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file = "app\\svelte\\index\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    // (97:4) {#if dropdowns.season}
    function create_if_block_13(ctx) {
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
    	let if_block0 = /*$seasons*/ ctx[5].spring && create_if_block_17(ctx);
    	let if_block1 = /*$seasons*/ ctx[5].summer && create_if_block_16(ctx);
    	let if_block2 = /*$seasons*/ ctx[5].fall && create_if_block_15(ctx);
    	let if_block3 = /*$seasons*/ ctx[5].winter && create_if_block_14(ctx);

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
    			add_location(button0, file, 98, 23, 2825);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 98, 6, 2808);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 99, 23, 3068);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 99, 6, 3051);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 100, 23, 3311);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 100, 6, 3294);
    			attr_dev(button3, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button3, file, 101, 23, 3548);
    			attr_dev(li3, "class", "ml-8");
    			add_location(li3, file, 101, 6, 3531);
    			add_location(ul, file, 97, 5, 2796);
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
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[14], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[15], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[16], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_4*/ ctx[17], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$seasons*/ ctx[5].spring) {
    				if (if_block0) {
    					if (dirty[0] & /*$seasons*/ 32) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_17(ctx);
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

    			if (/*$seasons*/ ctx[5].summer) {
    				if (if_block1) {
    					if (dirty[0] & /*$seasons*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_16(ctx);
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

    			if (/*$seasons*/ ctx[5].fall) {
    				if (if_block2) {
    					if (dirty[0] & /*$seasons*/ 32) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_15(ctx);
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

    			if (/*$seasons*/ ctx[5].winter) {
    				if (if_block3) {
    					if (dirty[0] & /*$seasons*/ 32) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_14(ctx);
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
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(97:4) {#if dropdowns.season}",
    		ctx
    	});

    	return block;
    }

    // (99:193) {#if $seasons.spring}
    function create_if_block_17(ctx) {
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
    		id: create_if_block_17.name,
    		type: "if",
    		source: "(99:193) {#if $seasons.spring}",
    		ctx
    	});

    	return block;
    }

    // (100:193) {#if $seasons.summer}
    function create_if_block_16(ctx) {
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
    		id: create_if_block_16.name,
    		type: "if",
    		source: "(100:193) {#if $seasons.summer}",
    		ctx
    	});

    	return block;
    }

    // (101:189) {#if $seasons.fall}
    function create_if_block_15(ctx) {
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
    		id: create_if_block_15.name,
    		type: "if",
    		source: "(101:189) {#if $seasons.fall}",
    		ctx
    	});

    	return block;
    }

    // (102:193) {#if $seasons.winter}
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
    		source: "(102:193) {#if $seasons.winter}",
    		ctx
    	});

    	return block;
    }

    // (113:4) {#if dropdowns.holiday}
    function create_if_block_9(ctx) {
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
    	let if_block0 = /*$holiday*/ ctx[6].easter && create_if_block_12(ctx);
    	let if_block1 = /*$holiday*/ ctx[6].thanksgiving && create_if_block_11(ctx);
    	let if_block2 = /*$holiday*/ ctx[6].christmas && create_if_block_10(ctx);

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
    			add_location(button0, file, 114, 23, 4367);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 114, 6, 4350);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 115, 23, 4610);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 115, 6, 4593);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 116, 23, 4871);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 116, 6, 4854);
    			add_location(ul, file, 113, 5, 4338);
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
    					listen_dev(button0, "click", /*click_handler_6*/ ctx[19], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_7*/ ctx[20], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_8*/ ctx[21], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$holiday*/ ctx[6].easter) {
    				if (if_block0) {
    					if (dirty[0] & /*$holiday*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_12(ctx);
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

    			if (/*$holiday*/ ctx[6].thanksgiving) {
    				if (if_block1) {
    					if (dirty[0] & /*$holiday*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_11(ctx);
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

    			if (/*$holiday*/ ctx[6].christmas) {
    				if (if_block2) {
    					if (dirty[0] & /*$holiday*/ 64) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_10(ctx);
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
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(113:4) {#if dropdowns.holiday}",
    		ctx
    	});

    	return block;
    }

    // (115:193) {#if $holiday.easter}
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
    		source: "(115:193) {#if $holiday.easter}",
    		ctx
    	});

    	return block;
    }

    // (116:205) {#if $holiday.thanksgiving}
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
    		source: "(116:205) {#if $holiday.thanksgiving}",
    		ctx
    	});

    	return block;
    }

    // (117:199) {#if $holiday.christmas}
    function create_if_block_10(ctx) {
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
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(117:199) {#if $holiday.christmas}",
    		ctx
    	});

    	return block;
    }

    // (128:4) {#if dropdowns.style}
    function create_if_block_5(ctx) {
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
    	let if_block0 = /*$style*/ ctx[7].modern && create_if_block_8(ctx);
    	let if_block1 = /*$style*/ ctx[7].old && create_if_block_7(ctx);
    	let if_block2 = /*$style*/ ctx[7].trash && create_if_block_6(ctx);

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
    			add_location(button0, file, 129, 23, 5692);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 129, 6, 5675);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 130, 23, 5931);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 130, 6, 5914);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 131, 23, 6161);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 131, 6, 6144);
    			add_location(ul, file, 128, 5, 5663);
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
    					listen_dev(button0, "click", /*click_handler_10*/ ctx[23], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_11*/ ctx[24], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_12*/ ctx[25], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$style*/ ctx[7].modern) {
    				if (if_block0) {
    					if (dirty[0] & /*$style*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_8(ctx);
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

    			if (/*$style*/ ctx[7].old) {
    				if (if_block1) {
    					if (dirty[0] & /*$style*/ 128) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_7(ctx);
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

    			if (/*$style*/ ctx[7].trash) {
    				if (if_block2) {
    					if (dirty[0] & /*$style*/ 128) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_6(ctx);
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(128:4) {#if dropdowns.style}",
    		ctx
    	});

    	return block;
    }

    // (130:191) {#if $style.modern}
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
    		source: "(130:191) {#if $style.modern}",
    		ctx
    	});

    	return block;
    }

    // (131:185) {#if $style.old}
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
    		source: "(131:185) {#if $style.old}",
    		ctx
    	});

    	return block;
    }

    // (132:189) {#if $style.trash}
    function create_if_block_6(ctx) {
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
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(132:189) {#if $style.trash}",
    		ctx
    	});

    	return block;
    }

    // (150:6) {#if showTooltip}
    function create_if_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "CFG... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.";
    			attr_dev(div, "class", "absolute w-52 bottom-full transform -translate-x-0 mb-2 bg-dark-200 border border-white drop-shadow-xl text-xs text-left p-2 rounded shadow-lg z-10");
    			add_location(div, file, 150, 7, 6945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(150:6) {#if showTooltip}",
    		ctx
    	});

    	return block;
    }

    // (166:3) {#if $seasons[season]}
    function create_if_block_3(ctx) {
    	let div;
    	let t0_value = /*season*/ ctx[43].charAt(0).toUpperCase() + /*season*/ ctx[43].slice(1) + "";
    	let t0;
    	let t1;
    	let button;
    	let cross;
    	let current;
    	let mounted;
    	let dispose;
    	cross = new Cross({ $$inline: true });

    	function click_handler_13() {
    		return /*click_handler_13*/ ctx[29](/*season*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			create_component(cross.$$.fragment);
    			attr_dev(button, "class", "rounded hover:bg-dark-200");
    			add_location(button, file, 168, 5, 7822);
    			attr_dev(div, "class", "flex justify-between items-center w-full p-2 mb-4 border border-white rounded");
    			add_location(div, file, 166, 4, 7630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			mount_component(cross, button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_13, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*$seasons*/ 32) && t0_value !== (t0_value = /*season*/ ctx[43].charAt(0).toUpperCase() + /*season*/ ctx[43].slice(1) + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cross.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cross.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(cross);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(166:3) {#if $seasons[season]}",
    		ctx
    	});

    	return block;
    }

    // (165:2) {#each Object.keys($seasons) as season}
    function create_each_block_2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$seasons*/ ctx[5][/*season*/ ctx[43]] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$seasons*/ ctx[5][/*season*/ ctx[43]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$seasons*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(165:2) {#each Object.keys($seasons) as season}",
    		ctx
    	});

    	return block;
    }

    // (175:3) {#if $holiday[holi]}
    function create_if_block_2(ctx) {
    	let div;
    	let t0_value = /*holi*/ ctx[40].charAt(0).toUpperCase() + /*holi*/ ctx[40].slice(1) + "";
    	let t0;
    	let t1;
    	let button;
    	let cross;
    	let current;
    	let mounted;
    	let dispose;
    	cross = new Cross({ $$inline: true });

    	function click_handler_14() {
    		return /*click_handler_14*/ ctx[30](/*holi*/ ctx[40]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			create_component(cross.$$.fragment);
    			attr_dev(button, "class", "rounded hover:bg-dark-200");
    			add_location(button, file, 177, 5, 8217);
    			attr_dev(div, "class", "flex justify-between items-center w-full p-2 mb-4 border border-white rounded");
    			add_location(div, file, 175, 4, 8031);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			mount_component(cross, button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_14, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*$holiday*/ 64) && t0_value !== (t0_value = /*holi*/ ctx[40].charAt(0).toUpperCase() + /*holi*/ ctx[40].slice(1) + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cross.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cross.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(cross);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(175:3) {#if $holiday[holi]}",
    		ctx
    	});

    	return block;
    }

    // (174:2) {#each Object.keys($holiday) as holi}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$holiday*/ ctx[6][/*holi*/ ctx[40]] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$holiday*/ ctx[6][/*holi*/ ctx[40]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$holiday*/ 64) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(174:2) {#each Object.keys($holiday) as holi}",
    		ctx
    	});

    	return block;
    }

    // (184:3) {#if $style[key]}
    function create_if_block_1(ctx) {
    	let div;
    	let t0_value = /*key*/ ctx[37].charAt(0).toUpperCase() + /*key*/ ctx[37].slice(1) + "";
    	let t0;
    	let t1;
    	let button;
    	let cross;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	cross = new Cross({ $$inline: true });

    	function click_handler_15() {
    		return /*click_handler_15*/ ctx[31](/*key*/ ctx[37]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			create_component(cross.$$.fragment);
    			t2 = space();
    			attr_dev(button, "class", "rounded hover:bg-dark-200");
    			add_location(button, file, 186, 5, 8603);
    			attr_dev(div, "class", "flex justify-between items-center w-full p-2 mb-4 border border-white rounded");
    			add_location(div, file, 184, 4, 8418);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			mount_component(cross, button, null);
    			append_dev(div, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_15, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*$style*/ 128) && t0_value !== (t0_value = /*key*/ ctx[37].charAt(0).toUpperCase() + /*key*/ ctx[37].slice(1) + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cross.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cross.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(cross);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(184:3) {#if $style[key]}",
    		ctx
    	});

    	return block;
    }

    // (183:2) {#each Object.keys($style) as key}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$style*/ ctx[7][/*key*/ ctx[37]] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$style*/ ctx[7][/*key*/ ctx[37]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$style*/ 128) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(183:2) {#each Object.keys($style) as key}",
    		ctx
    	});

    	return block;
    }

    // (198:3) {:else}
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
    			add_location(img, file, 198, 4, 9231);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*imageSrc*/ 1 && !src_url_equal(img.src, img_src_value = /*imageSrc*/ ctx[0])) {
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
    		source: "(198:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (195:3) {#if !imageSrc}
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
    			add_location(h1, file, 195, 4, 9024);
    			attr_dev(p, "class", "text-xs");
    			add_location(p, file, 196, 4, 9129);
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
    		source: "(195:3) {#if !imageSrc}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
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
    	let p0;
    	let t12;
    	let p1;
    	let t14;
    	let ul1;
    	let li3;
    	let div1;
    	let div0;
    	let p2;
    	let t16;
    	let t17;
    	let input0;
    	let t18;
    	let p3;
    	let t19;
    	let t20;
    	let section;
    	let t21;
    	let t22;
    	let t23;
    	let main;
    	let label;
    	let t24;
    	let input1;
    	let t25;
    	let button3;
    	let t26;
    	let button3_class_value;
    	let button3_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*dropdowns*/ ctx[2].season && create_if_block_13(ctx);
    	let if_block1 = /*dropdowns*/ ctx[2].holiday && create_if_block_9(ctx);
    	let if_block2 = /*dropdowns*/ ctx[2].style && create_if_block_5(ctx);
    	let if_block3 = /*showTooltip*/ ctx[4] && create_if_block_4(ctx);
    	let each_value_2 = Object.keys(/*$seasons*/ ctx[5]);
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_1 = Object.keys(/*$holiday*/ ctx[6]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out_1 = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = Object.keys(/*$style*/ ctx[7]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_2 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function select_block_type(ctx, dirty) {
    		if (!/*imageSrc*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block4 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
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
    			p0 = element("p");
    			p0.textContent = "Advanced Settings";
    			t12 = space();
    			p1 = element("p");
    			p1.textContent = "Hover each setting to get a description.";
    			t14 = space();
    			ul1 = element("ul");
    			li3 = element("li");
    			div1 = element("div");
    			div0 = element("div");
    			p2 = element("p");
    			p2.textContent = "CFG";
    			t16 = space();
    			if (if_block3) if_block3.c();
    			t17 = space();
    			input0 = element("input");
    			t18 = space();
    			p3 = element("p");
    			t19 = text(/*cfgValue*/ ctx[3]);
    			t20 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t21 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t22 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t23 = space();
    			main = element("main");
    			label = element("label");
    			if_block4.c();
    			t24 = space();
    			input1 = element("input");
    			t25 = space();
    			button3 = element("button");
    			t26 = text("Generate");
    			attr_dev(h1, "class", "p-2 text-5xl font-title tracking-widest font-bold");
    			add_location(h1, file, 88, 2, 2171);
    			attr_dev(path0, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path0, file, 94, 211, 2677);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "height", "16px");
    			attr_dev(svg0, "viewBox", "0 -960 960 960");
    			attr_dev(svg0, "width", "16px");
    			attr_dev(svg0, "fill", "#ffffff");
    			set_style(svg0, "transform", "rotate(" + (/*dropdowns*/ ctx[2].season ? '90deg' : '0deg') + ")");
    			set_style(svg0, "transition", "transform 0.3s ease");
    			add_location(svg0, file, 94, 5, 2471);
    			attr_dev(button0, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 92, 4, 2299);
    			add_location(li0, file, 91, 3, 2289);
    			attr_dev(path1, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path1, file, 110, 212, 4218);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "height", "16px");
    			attr_dev(svg1, "viewBox", "0 -960 960 960");
    			attr_dev(svg1, "width", "16px");
    			attr_dev(svg1, "fill", "#ffffff");
    			set_style(svg1, "transform", "rotate(" + (/*dropdowns*/ ctx[2].holiday ? '90deg' : '0deg') + ")");
    			set_style(svg1, "transition", "transform 0.3s ease");
    			add_location(svg1, file, 110, 5, 4011);
    			attr_dev(button1, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 108, 4, 3837);
    			add_location(li1, file, 107, 3, 3827);
    			attr_dev(path2, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path2, file, 125, 210, 5545);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "height", "16px");
    			attr_dev(svg2, "viewBox", "0 -960 960 960");
    			attr_dev(svg2, "width", "16px");
    			attr_dev(svg2, "fill", "#ffffff");
    			set_style(svg2, "transform", "rotate(" + (/*dropdowns*/ ctx[2].style ? '90deg' : '0deg') + ")");
    			set_style(svg2, "transition", "transform 0.3s ease");
    			add_location(svg2, file, 125, 5, 5340);
    			attr_dev(button2, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 123, 4, 5170);
    			add_location(li2, file, 122, 3, 5160);
    			attr_dev(ul0, "class", "mt-8");
    			add_location(ul0, file, 89, 2, 2247);
    			attr_dev(p0, "class", "text-left p-2 mt-8");
    			add_location(p0, file, 138, 2, 6450);
    			attr_dev(p1, "class", "text-left px-2 mb-4 text-xs text-gray-500");
    			add_location(p1, file, 139, 2, 6505);
    			attr_dev(p2, "class", "");
    			add_location(p2, file, 147, 6, 6884);
    			attr_dev(div0, "class", "relative inline-block hover:cursor-pointer");
    			add_location(div0, file, 144, 5, 6721);
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "100");
    			attr_dev(input0, "step", "1");
    			add_location(input0, file, 155, 5, 7304);
    			attr_dev(p3, "class", "text-right w-[2.5ch]");
    			add_location(p3, file, 156, 5, 7382);
    			attr_dev(div1, "class", "flex justify-between items-center w-full p-2 gap-4 rounded");
    			add_location(div1, file, 143, 4, 6642);
    			add_location(li3, file, 142, 3, 6632);
    			add_location(ul1, file, 140, 2, 6606);
    			attr_dev(nav, "class", "w-1/5 min-h-max bg-dark-200 text-white p-4 text-base border-r text-center");
    			add_location(nav, file, 87, 1, 2080);
    			attr_dev(section, "class", "w-1/5 h-full bg-black text-white p-4");
    			add_location(section, file, 163, 1, 7500);
    			attr_dev(label, "for", "filepicker");
    			attr_dev(label, "class", "px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100 cursor-pointer");
    			add_location(label, file, 193, 2, 8855);
    			attr_dev(input1, "type", "file");
    			attr_dev(input1, "accept", "image/**");
    			attr_dev(input1, "id", "filepicker");
    			set_style(input1, "display", "none");
    			add_location(input1, file, 201, 2, 9374);
    			attr_dev(button3, "type", "button");

    			attr_dev(button3, "class", button3_class_value = "mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out " + (/*imageSrc*/ ctx[0]
    			? 'hover:bg-dark-100 cursor-pointer'
    			: 'opacity-50 cursor-not-allowed'));

    			button3.disabled = button3_disabled_value = !/*imageSrc*/ ctx[0];
    			add_location(button3, file, 202, 2, 9483);
    			attr_dev(main, "class", "flex flex-col items-center justify-center h-full w-full bg-black text-white font-body");
    			add_location(main, file, 192, 1, 8751);
    			attr_dev(div2, "class", "flex h-screen max-w-screen");
    			add_location(div2, file, 86, 0, 2037);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, nav);
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
    			append_dev(nav, p0);
    			append_dev(nav, t12);
    			append_dev(nav, p1);
    			append_dev(nav, t14);
    			append_dev(nav, ul1);
    			append_dev(ul1, li3);
    			append_dev(li3, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p2);
    			append_dev(div0, t16);
    			if (if_block3) if_block3.m(div0, null);
    			append_dev(div1, t17);
    			append_dev(div1, input0);
    			set_input_value(input0, /*cfgValue*/ ctx[3]);
    			append_dev(div1, t18);
    			append_dev(div1, p3);
    			append_dev(p3, t19);
    			append_dev(div2, t20);
    			append_dev(div2, section);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(section, null);
    				}
    			}

    			append_dev(section, t21);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(section, null);
    				}
    			}

    			append_dev(section, t22);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(section, null);
    				}
    			}

    			append_dev(div2, t23);
    			append_dev(div2, main);
    			append_dev(main, label);
    			if_block4.m(label, null);
    			append_dev(main, t24);
    			append_dev(main, input1);
    			append_dev(main, t25);
    			append_dev(main, button3);
    			append_dev(button3, t26);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[13], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[18], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_9*/ ctx[22], false, false, false, false),
    					listen_dev(div0, "mouseenter", /*mouseenter_handler*/ ctx[26], false, false, false, false),
    					listen_dev(div0, "mouseleave", /*mouseleave_handler*/ ctx[27], false, false, false, false),
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[28]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[28]),
    					listen_dev(input1, "change", /*handleFileDrop*/ ctx[12], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_16*/ ctx[32], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*dropdowns*/ 4) {
    				set_style(svg0, "transform", "rotate(" + (/*dropdowns*/ ctx[2].season ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[2].season) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*dropdowns*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_13(ctx);
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

    			if (!current || dirty[0] & /*dropdowns*/ 4) {
    				set_style(svg1, "transform", "rotate(" + (/*dropdowns*/ ctx[2].holiday ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[2].holiday) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*dropdowns*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_9(ctx);
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

    			if (!current || dirty[0] & /*dropdowns*/ 4) {
    				set_style(svg2, "transform", "rotate(" + (/*dropdowns*/ ctx[2].style ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[2].style) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*dropdowns*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5(ctx);
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

    			if (/*showTooltip*/ ctx[4]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_4(ctx);
    					if_block3.c();
    					if_block3.m(div0, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*cfgValue*/ 8) {
    				set_input_value(input0, /*cfgValue*/ ctx[3]);
    			}

    			if (!current || dirty[0] & /*cfgValue*/ 8) set_data_dev(t19, /*cfgValue*/ ctx[3]);

    			if (dirty[0] & /*seasons, $seasons*/ 544) {
    				each_value_2 = Object.keys(/*$seasons*/ ctx[5]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    						transition_in(each_blocks_2[i], 1);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						transition_in(each_blocks_2[i], 1);
    						each_blocks_2[i].m(section, t21);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*holiday, $holiday*/ 1088) {
    				each_value_1 = Object.keys(/*$holiday*/ ctx[6]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(section, t22);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*style, $style*/ 2176) {
    				each_value = Object.keys(/*$style*/ ctx[7]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_2(i);
    				}

    				check_outros();
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

    			if (!current || dirty[0] & /*imageSrc*/ 1 && button3_class_value !== (button3_class_value = "mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out " + (/*imageSrc*/ ctx[0]
    			? 'hover:bg-dark-100 cursor-pointer'
    			: 'opacity-50 cursor-not-allowed'))) {
    				attr_dev(button3, "class", button3_class_value);
    			}

    			if (!current || dirty[0] & /*imageSrc*/ 1 && button3_disabled_value !== (button3_disabled_value = !/*imageSrc*/ ctx[0])) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			each_blocks_2 = each_blocks_2.filter(Boolean);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
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

    // Set the specified key to false
    function setFalse(store, key) {
    	store.update(map => {
    		return { ...map, [key]: false };
    	});
    }

    function instance($$self, $$props, $$invalidate) {
    	let $seasons;
    	let $holiday;
    	let $style;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let imageSrc = '';
    	let imageFile = null;

    	let dropdowns = {
    		season: false,
    		holiday: false,
    		style: false,
    		cfg: false
    	};

    	function toggleDropdown(key) {
    		$$invalidate(2, dropdowns[key] = !dropdowns[key], dropdowns);
    	}

    	// All categories
    	let seasons = writable({
    		spring: false,
    		summer: false,
    		fall: false,
    		winter: false
    	});

    	validate_store(seasons, 'seasons');
    	component_subscribe($$self, seasons, value => $$invalidate(5, $seasons = value));

    	let holiday = writable({
    		easter: false,
    		thanksgiving: false,
    		christmas: false
    	});

    	validate_store(holiday, 'holiday');
    	component_subscribe($$self, holiday, value => $$invalidate(6, $holiday = value));
    	let style = writable({ modern: false, old: false, trash: false });
    	validate_store(style, 'style');
    	component_subscribe($$self, style, value => $$invalidate(7, $style = value));

    	function handleFileDrop(event) {
    		fileDrop(event, (src, file) => {
    			$$invalidate(0, imageSrc = src);
    			$$invalidate(1, imageFile = file); // Save the File object for upload
    		});
    	}

    	// Custom Settings and default values
    	let imageWidth = 800;

    	let imageHeight = 800;
    	let cfgValue = 20;
    	let steps = 20;
    	let denoise = 0.7;
    	let showTooltip = false;
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
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
    	const mouseenter_handler = () => $$invalidate(4, showTooltip = true);
    	const mouseleave_handler = () => $$invalidate(4, showTooltip = false);

    	function input0_change_input_handler() {
    		cfgValue = to_number(this.value);
    		$$invalidate(3, cfgValue);
    	}

    	const click_handler_13 = season => setFalse(seasons, season);
    	const click_handler_14 = holi => setFalse(holiday, holi);
    	const click_handler_15 = key => setFalse(style, key);
    	const click_handler_16 = () => uploadImage(imageFile);

    	$$self.$capture_state = () => ({
    		fileDrop,
    		uploadImage,
    		debug,
    		writable,
    		Check,
    		Cross,
    		imageSrc,
    		imageFile,
    		dropdowns,
    		toggleDropdown,
    		seasons,
    		holiday,
    		style,
    		setTrue,
    		setFalse,
    		handleFileDrop,
    		imageWidth,
    		imageHeight,
    		cfgValue,
    		steps,
    		denoise,
    		showTooltip,
    		$seasons,
    		$holiday,
    		$style
    	});

    	$$self.$inject_state = $$props => {
    		if ('imageSrc' in $$props) $$invalidate(0, imageSrc = $$props.imageSrc);
    		if ('imageFile' in $$props) $$invalidate(1, imageFile = $$props.imageFile);
    		if ('dropdowns' in $$props) $$invalidate(2, dropdowns = $$props.dropdowns);
    		if ('seasons' in $$props) $$invalidate(9, seasons = $$props.seasons);
    		if ('holiday' in $$props) $$invalidate(10, holiday = $$props.holiday);
    		if ('style' in $$props) $$invalidate(11, style = $$props.style);
    		if ('imageWidth' in $$props) imageWidth = $$props.imageWidth;
    		if ('imageHeight' in $$props) imageHeight = $$props.imageHeight;
    		if ('cfgValue' in $$props) $$invalidate(3, cfgValue = $$props.cfgValue);
    		if ('steps' in $$props) steps = $$props.steps;
    		if ('denoise' in $$props) denoise = $$props.denoise;
    		if ('showTooltip' in $$props) $$invalidate(4, showTooltip = $$props.showTooltip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		imageSrc,
    		imageFile,
    		dropdowns,
    		cfgValue,
    		showTooltip,
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
    		mouseenter_handler,
    		mouseleave_handler,
    		input0_change_input_handler,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15,
    		click_handler_16
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

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
