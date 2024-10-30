
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
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

    async function uploadImage(image, promptList, steps=20, cfg_scale=7.0, denoising_strength=0.7, width=1024, height=1024, negativePromtList, sampler = "Euler a") {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('prompt', promptList);
        formData.append('negativePrompt', negativePromtList);
        formData.append('sampler', sampler);
        formData.append('steps', steps);
        formData.append('cfg_scale', cfg_scale);
        formData.append('denoising_strength', denoising_strength);
        formData.append('width', width);
        formData.append('height', height);
       

        let response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          let data = await response.json();
      
          console.log(data); // Log the response to inspect its structure

        // Accessing the image
        if (data.result && data.result.image) {
        // Assuming it's a base64 string, you can directly set it to an image element
        let imageSrc = `data:image/png;base64,${data.result.image}`;
        return imageSrc;
        } else {
        throw new Error('No image returned from the server');
    }
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

    const { Boolean: Boolean_1, console: console_1 } = globals;
    const file = "app\\svelte\\index\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	child_ctx[41] = list;
    	child_ctx[42] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    // (164:5) {#if categoryType.isOpen}
    function create_if_block_5(ctx) {
    	let each_1_anchor;
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[22](/*categoryType*/ ctx[43], ...args);
    	}

    	let each_value_3 = /*$categories*/ ctx[3].filter(func);
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*toggleCategory, $categories, $categoryTypes*/ 66568) {
    				each_value_3 = /*$categories*/ ctx[3].filter(func);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean_1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(164:5) {#if categoryType.isOpen}",
    		ctx
    	});

    	return block;
    }

    // (169:9) {#if category.isActive}
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
    		source: "(169:9) {#if category.isActive}",
    		ctx
    	});

    	return block;
    }

    // (165:6) {#each $categories.filter(category => category.type === categoryType.name) as category}
    function create_each_block_3(ctx) {
    	let li;
    	let button;
    	let t0_value = /*category*/ ctx[37].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*category*/ ctx[37].isActive && create_if_block_6(ctx);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[23](/*category*/ ctx[37]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(button, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button, file, 166, 8, 6647);
    			attr_dev(li, "class", "ml-8");
    			add_location(li, file, 165, 7, 6620);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			if (if_block) if_block.m(button, null);
    			append_dev(li, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*$categories, $categoryTypes*/ 1032) && t0_value !== (t0_value = /*category*/ ctx[37].name + "")) set_data_dev(t0, t0_value);

    			if (/*category*/ ctx[37].isActive) {
    				if (if_block) {
    					if (dirty[0] & /*$categories, $categoryTypes*/ 1032) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(button, null);
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
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(165:6) {#each $categories.filter(category => category.type === categoryType.name) as category}",
    		ctx
    	});

    	return block;
    }

    // (158:3) {#each $categoryTypes as categoryType}
    function create_each_block_2(ctx) {
    	let li;
    	let button;
    	let t0_value = /*categoryType*/ ctx[43].name + "";
    	let t0;
    	let t1;
    	let svg;
    	let path;
    	let t2;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[21](/*categoryType*/ ctx[43]);
    	}

    	let if_block = /*categoryType*/ ctx[43].isOpen && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			attr_dev(path, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path, file, 161, 215, 6399);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "16px");
    			attr_dev(svg, "viewBox", "0 -960 960 960");
    			attr_dev(svg, "width", "16px");
    			attr_dev(svg, "fill", "#ffffff");
    			set_style(svg, "transform", "rotate(" + (/*categoryType*/ ctx[43].isOpen ? '90deg' : '0deg') + ")");
    			set_style(svg, "transition", "transform 0.3s ease");
    			add_location(svg, file, 161, 6, 6190);
    			attr_dev(button, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button, file, 159, 5, 5999);
    			add_location(li, file, 158, 4, 5988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(li, t2);
    			if (if_block) if_block.m(li, null);
    			append_dev(li, t3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*$categoryTypes*/ 1024) && t0_value !== (t0_value = /*categoryType*/ ctx[43].name + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*$categoryTypes*/ 1024) {
    				set_style(svg, "transform", "rotate(" + (/*categoryType*/ ctx[43].isOpen ? '90deg' : '0deg') + ")");
    			}

    			if (/*categoryType*/ ctx[43].isOpen) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$categoryTypes*/ 1024) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(li, t3);
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
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(158:3) {#each $categoryTypes as categoryType}",
    		ctx
    	});

    	return block;
    }

    // (191:6) {#if setting.showTooltip}
    function create_if_block_4(ctx) {
    	let div;
    	let t_value = /*setting*/ ctx[40].descrition + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "absolute w-52 bottom-full transform -translate-x-0 mb-2 bg-dark-200 border border-white drop-shadow-xl text-xs text-left p-2 rounded shadow-lg z-10");
    			add_location(div, file, 191, 5, 7594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*advancedSettings*/ 16 && t_value !== (t_value = /*setting*/ ctx[40].descrition + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(191:6) {#if setting.showTooltip}",
    		ctx
    	});

    	return block;
    }

    // (184:3) {#each advancedSettings as setting}
    function create_each_block_1(ctx) {
    	let li;
    	let div;
    	let p;
    	let t0_value = /*setting*/ ctx[40].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let input0;
    	let input0_min_value;
    	let input0_max_value;
    	let input0_step_value;
    	let t3;
    	let input1;
    	let input1_min_value;
    	let input1_max_value;
    	let input1_step_value;
    	let t4;
    	let mounted;
    	let dispose;
    	let if_block = /*setting*/ ctx[40].showTooltip && create_if_block_4(ctx);

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[24](/*setting*/ ctx[40], /*each_value_1*/ ctx[41], /*setting_index*/ ctx[42]);
    	}

    	function mouseleave_handler() {
    		return /*mouseleave_handler*/ ctx[25](/*setting*/ ctx[40], /*each_value_1*/ ctx[41], /*setting_index*/ ctx[42]);
    	}

    	function input0_change_input_handler() {
    		/*input0_change_input_handler*/ ctx[26].call(input0, /*each_value_1*/ ctx[41], /*setting_index*/ ctx[42]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[27].call(input1, /*each_value_1*/ ctx[41], /*setting_index*/ ctx[42]);
    	}

    	function blur_handler(...args) {
    		return /*blur_handler*/ ctx[28](/*setting*/ ctx[40], /*each_value_1*/ ctx[41], /*setting_index*/ ctx[42], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			input1 = element("input");
    			t4 = space();
    			attr_dev(p, "class", "w-[7ch] text-left");
    			add_location(p, file, 188, 6, 7499);
    			attr_dev(div, "class", "relative inline-block hover:cursor-pointer");
    			add_location(div, file, 185, 4, 7322);
    			attr_dev(input0, "class", "hover:cursor-pointer");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", input0_min_value = /*setting*/ ctx[40].min);
    			attr_dev(input0, "max", input0_max_value = /*setting*/ ctx[40].max);
    			attr_dev(input0, "step", input0_step_value = /*setting*/ ctx[40].step);
    			add_location(input0, file, 196, 4, 7840);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", input1_min_value = /*setting*/ ctx[40].min);
    			attr_dev(input1, "max", input1_max_value = /*setting*/ ctx[40].max);
    			attr_dev(input1, "step", input1_step_value = /*setting*/ ctx[40].step);
    			attr_dev(input1, "class", "text-right w-[4ch] bg-transparent outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded transition-colors duration-2000");
    			add_location(input1, file, 197, 4, 7986);
    			attr_dev(li, "class", "flex justify-between items-center w-full p-2 gap-2 rounded");
    			add_location(li, file, 184, 5, 7245);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(li, t2);
    			append_dev(li, input0);
    			set_input_value(input0, /*setting*/ ctx[40].value);
    			append_dev(li, t3);
    			append_dev(li, input1);
    			set_input_value(input1, /*setting*/ ctx[40].value);
    			append_dev(li, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", mouseenter_handler, false, false, false, false),
    					listen_dev(div, "mouseleave", mouseleave_handler, false, false, false, false),
    					listen_dev(input0, "change", input0_change_input_handler),
    					listen_dev(input0, "input", input0_change_input_handler),
    					listen_dev(input1, "input", input1_input_handler),
    					listen_dev(input1, "focus", focus_handler, false, false, false, false),
    					listen_dev(input1, "blur", blur_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*advancedSettings*/ 16 && t0_value !== (t0_value = /*setting*/ ctx[40].name + "")) set_data_dev(t0, t0_value);

    			if (/*setting*/ ctx[40].showTooltip) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*advancedSettings*/ 16 && input0_min_value !== (input0_min_value = /*setting*/ ctx[40].min)) {
    				attr_dev(input0, "min", input0_min_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 16 && input0_max_value !== (input0_max_value = /*setting*/ ctx[40].max)) {
    				attr_dev(input0, "max", input0_max_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 16 && input0_step_value !== (input0_step_value = /*setting*/ ctx[40].step)) {
    				attr_dev(input0, "step", input0_step_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 16) {
    				set_input_value(input0, /*setting*/ ctx[40].value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 16 && input1_min_value !== (input1_min_value = /*setting*/ ctx[40].min)) {
    				attr_dev(input1, "min", input1_min_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 16 && input1_max_value !== (input1_max_value = /*setting*/ ctx[40].max)) {
    				attr_dev(input1, "max", input1_max_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 16 && input1_step_value !== (input1_step_value = /*setting*/ ctx[40].step)) {
    				attr_dev(input1, "step", input1_step_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 16 && to_number(input1.value) !== /*setting*/ ctx[40].value) {
    				set_input_value(input1, /*setting*/ ctx[40].value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(184:3) {#each advancedSettings as setting}",
    		ctx
    	});

    	return block;
    }

    // (246:5) {#if category.isActive}
    function create_if_block_3(ctx) {
    	let div;
    	let t0_value = /*category*/ ctx[37].name + "";
    	let t0;
    	let t1;
    	let button;
    	let cross;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	cross = new Cross({ $$inline: true });

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[29](/*category*/ ctx[37]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			create_component(cross.$$.fragment);
    			t2 = space();
    			attr_dev(button, "class", "rounded hover:bg-dark-100");
    			add_location(button, file, 248, 7, 9962);
    			attr_dev(div, "class", "flex justify-between bg-dark-200 items-center max-w-48 p-2 mb-4 border border-white rounded");
    			add_location(div, file, 246, 6, 9823);
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
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*$categories*/ 8) && t0_value !== (t0_value = /*category*/ ctx[37].name + "")) set_data_dev(t0, t0_value);
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
    		source: "(246:5) {#if category.isActive}",
    		ctx
    	});

    	return block;
    }

    // (245:4) {#each $categories as category}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*category*/ ctx[37].isActive && create_if_block_3(ctx);

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
    			if (/*category*/ ctx[37].isActive) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$categories*/ 8) {
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(245:4) {#each $categories as category}",
    		ctx
    	});

    	return block;
    }

    // (267:4) {:else}
    function create_else_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*imageSrc*/ ctx[8])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "max-w-xs h-auto object-contain");
    			attr_dev(img, "id", "output");
    			set_style(img, "display", "block");
    			attr_dev(img, "alt", "Uploaded_image");
    			add_location(img, file, 267, 5, 10906);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*imageSrc*/ 256 && !src_url_equal(img.src, img_src_value = /*imageSrc*/ ctx[8])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(267:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (264:4) {#if !imageSrc}
    function create_if_block_2(ctx) {
    	let h1;
    	let t1;
    	let p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Click to add image";
    			t1 = space();
    			p = element("p");
    			p.textContent = "The image should contain your product in a room.";
    			attr_dev(h1, "class", "text-3xl text-red-500 font-bold tracking-tight text-center mb-5");
    			add_location(h1, file, 264, 5, 10709);
    			attr_dev(p, "class", "text-xs");
    			add_location(p, file, 265, 5, 10815);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(264:4) {#if !imageSrc}",
    		ctx
    	});

    	return block;
    }

    // (279:4) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*buttonText*/ ctx[6]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*buttonText*/ 64) set_data_dev(t, /*buttonText*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(279:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (273:4) {#if isLoading}
    function create_if_block_1(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t0 = space();
    			t1 = text(/*buttonText*/ ctx[6]);
    			attr_dev(path0, "d", "M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z");
    			attr_dev(path0, "fill", "#E5E7EB");
    			add_location(path0, file, 274, 6, 11656);
    			attr_dev(path1, "d", "M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z");
    			attr_dev(path1, "fill", "currentColor");
    			add_location(path1, file, 275, 6, 12055);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "status");
    			attr_dev(svg, "class", "inline w-4 h-4 me-3 text-white animate-spin");
    			attr_dev(svg, "viewBox", "0 0 100 101");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file, 273, 5, 11489);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*buttonText*/ 64) set_data_dev(t1, /*buttonText*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(273:4) {#if isLoading}",
    		ctx
    	});

    	return block;
    }

    // (284:3) {#if $isGenerated && !isLoading}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let button;
    	let t4;
    	let a;
    	let t5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Generated Image";
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Close";
    			t4 = space();
    			a = element("a");
    			t5 = text("Download");
    			attr_dev(h2, "class", "text-2xl mb-4");
    			add_location(h2, file, 286, 5, 12986);
    			if (!src_url_equal(img.src, img_src_value = /*genImageSrc*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "max-w-full h-auto object-contain mb-4");
    			attr_dev(img, "alt", "Generated_image");
    			add_location(img, file, 287, 5, 13039);
    			attr_dev(button, "class", "text-white bg-red-500 hover:bg-red-700 py-2 px-4 rounded");
    			add_location(button, file, 288, 6, 13140);
    			attr_dev(a, "href", /*genImageSrc*/ ctx[5]);
    			attr_dev(a, "download", "generated_image.png");
    			attr_dev(a, "class", "text-white bg-blue-500 hover:bg-blue-700 py-2 px-4 rounded");
    			add_location(a, file, 289, 6, 13275);
    			attr_dev(div0, "class", "bg-dark-200 border border-white rounded-lg p-8 max-w-lg w-full");
    			add_location(div0, file, 285, 4, 12903);
    			attr_dev(div1, "class", "fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50");
    			add_location(div1, file, 284, 3, 12809);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, img);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			append_dev(div0, t4);
    			append_dev(div0, a);
    			append_dev(a, t5);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_4*/ ctx[32], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*genImageSrc*/ 32 && !src_url_equal(img.src, img_src_value = /*genImageSrc*/ ctx[5])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*genImageSrc*/ 32) {
    				attr_dev(a, "href", /*genImageSrc*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(284:3) {#if $isGenerated && !isLoading}",
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
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let ul1;
    	let t7;
    	let main;
    	let section0;
    	let div0;
    	let p2;
    	let t9;
    	let t10;
    	let div1;
    	let t11;
    	let textarea;
    	let t12;
    	let t13;
    	let t14;
    	let section1;
    	let label;
    	let t15;
    	let input;
    	let t16;
    	let button;
    	let button_class_value;
    	let t17;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*$categoryTypes*/ ctx[10];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_1 = /*advancedSettings*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*$categories*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function select_block_type(ctx, dirty) {
    		if (!/*imageSrc*/ ctx[8]) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*isLoading*/ ctx[1]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*$isGenerated*/ ctx[11] && !/*isLoading*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			nav = element("nav");
    			h1 = element("h1");
    			h1.textContent = "PÅHITTIG";
    			t1 = space();
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Advanced Settings";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Hover over each setting to get a description.";
    			t6 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			main = element("main");
    			section0 = element("section");
    			div0 = element("div");
    			p2 = element("p");
    			p2.textContent = "Active filters:";
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			div1 = element("div");
    			t11 = text("Negative prompt\r\n\t\t\t\t");
    			textarea = element("textarea");
    			t12 = space();
    			t13 = text(/*wordCount*/ ctx[9]);
    			t14 = space();
    			section1 = element("section");
    			label = element("label");
    			if_block0.c();
    			t15 = space();
    			input = element("input");
    			t16 = space();
    			button = element("button");
    			if_block1.c();
    			t17 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h1, "class", "p-2 text-5xl font-title tracking-widest font-bold");
    			add_location(h1, file, 155, 2, 5843);
    			attr_dev(ul0, "class", "mt-8");
    			add_location(ul0, file, 156, 2, 5922);
    			attr_dev(p0, "class", "text-left p-2 mt-8");
    			add_location(p0, file, 180, 2, 7033);
    			attr_dev(p1, "class", "text-left px-2 mb-4 text-xs text-gray-500");
    			add_location(p1, file, 181, 2, 7088);
    			add_location(ul1, file, 182, 2, 7194);
    			attr_dev(nav, "class", "min-h-max bg-dark-200 text-white p-4 text-base border-r text-center");
    			add_location(nav, file, 154, 1, 5758);
    			attr_dev(p2, "class", "mb-4");
    			add_location(p2, file, 243, 4, 9713);
    			attr_dev(div0, "class", "min-h-[280px]");
    			add_location(div0, file, 242, 3, 9680);
    			attr_dev(textarea, "type", "text");
    			attr_dev(textarea, "placeholder", "Example: flowers, trash...");
    			attr_dev(textarea, "class", "bg-dark-200 border border-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500");
    			add_location(textarea, file, 256, 4, 10189);
    			attr_dev(div1, "class", "flex flex-col gap-2 w-80");
    			add_location(div1, file, 254, 3, 10124);
    			attr_dev(section0, "class", "flex flex-col justify-center h-full bg-black text-white gap-4");
    			add_location(section0, file, 241, 2, 9596);
    			attr_dev(label, "for", "filepicker");
    			attr_dev(label, "class", "px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100 cursor-pointer");
    			add_location(label, file, 262, 3, 10538);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "accept", "image/**");
    			attr_dev(input, "id", "filepicker");
    			set_style(input, "display", "none");
    			add_location(input, file, 270, 3, 11052);
    			attr_dev(button, "type", "button");

    			attr_dev(button, "class", button_class_value = "mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out " + (/*isGenerateDisabled*/ ctx[7]
    			? 'opacity-50 cursor-not-allowed'
    			: 'hover:bg-dark-100 cursor-pointer'));

    			button.disabled = /*isGenerateDisabled*/ ctx[7];
    			add_location(button, file, 271, 3, 11162);
    			attr_dev(section1, "class", "flex flex-col items-center justify-center h-screen bg-black text-white font-body");
    			add_location(section1, file, 261, 2, 10435);
    			attr_dev(main, "class", "flex w-full justify-center gap-32");
    			add_location(main, file, 239, 1, 9517);
    			attr_dev(div2, "class", "flex min-h-screen max-w-screen bg-black");
    			add_location(div2, file, 153, 0, 5702);
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

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(ul0, null);
    				}
    			}

    			append_dev(nav, t2);
    			append_dev(nav, p0);
    			append_dev(nav, t4);
    			append_dev(nav, p1);
    			append_dev(nav, t6);
    			append_dev(nav, ul1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(ul1, null);
    				}
    			}

    			append_dev(div2, t7);
    			append_dev(div2, main);
    			append_dev(main, section0);
    			append_dev(section0, div0);
    			append_dev(div0, p2);
    			append_dev(div0, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(section0, t10);
    			append_dev(section0, div1);
    			append_dev(div1, t11);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*negativePrompt*/ ctx[2]);
    			append_dev(div1, t12);
    			append_dev(div1, t13);
    			append_dev(main, t14);
    			append_dev(main, section1);
    			append_dev(section1, label);
    			if_block0.m(label, null);
    			append_dev(section1, t15);
    			append_dev(section1, input);
    			append_dev(section1, t16);
    			append_dev(section1, button);
    			if_block1.m(button, null);
    			append_dev(section1, t17);
    			if (if_block2) if_block2.m(section1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[30]),
    					listen_dev(input, "change", /*handleFileDrop*/ ctx[18], false, false, false, false),
    					listen_dev(button, "click", /*click_handler_3*/ ctx[31], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$categories, $categoryTypes, toggleCategory, toggleDropdown*/ 99336) {
    				each_value_2 = /*$categoryTypes*/ ctx[10];
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
    						each_blocks_2[i].m(ul0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*advancedSettings*/ 16) {
    				each_value_1 = /*advancedSettings*/ ctx[4];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*deactivateCategory, $categories*/ 131080) {
    				each_value = /*$categories*/ ctx[3];
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
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*negativePrompt*/ 4) {
    				set_input_value(textarea, /*negativePrompt*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*wordCount*/ 512) set_data_dev(t13, /*wordCount*/ ctx[9]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(label, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button, null);
    				}
    			}

    			if (!current || dirty[0] & /*isGenerateDisabled*/ 128 && button_class_value !== (button_class_value = "mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out " + (/*isGenerateDisabled*/ ctx[7]
    			? 'opacity-50 cursor-not-allowed'
    			: 'hover:bg-dark-100 cursor-pointer'))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty[0] & /*isGenerateDisabled*/ 128) {
    				prop_dev(button, "disabled", /*isGenerateDisabled*/ ctx[7]);
    			}

    			if (/*$isGenerated*/ ctx[11] && !/*isLoading*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(section1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_2 = each_blocks_2.filter(Boolean_1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean_1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
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

    const focus_handler = e => {
    	e.target.classList.add('outline', 'outline-white');
    };

    function instance($$self, $$props, $$invalidate) {
    	let promptList;
    	let wordCount;
    	let imageSrc;
    	let isGenerateDisabled;
    	let buttonText;
    	let genImageSrc;
    	let $categories;
    	let $categoryTypes;
    	let $isGenerated;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let imageFile = null;
    	let isLoading = false;
    	let negativePrompt = '';
    	let genImageFile = null;
    	let isGenerated = writable(false);
    	validate_store(isGenerated, 'isGenerated');
    	component_subscribe($$self, isGenerated, value => $$invalidate(11, $isGenerated = value));

    	// Categories
    	class CategoryType {
    		constructor(name) {
    			this.name = name;
    			this.isOpen = false;
    		}
    	}

    	class Category {
    		constructor(name, type, prompt) {
    			this.name = name;
    			this.type = type;
    			this.prompt = prompt;
    			this.isActive = false;
    		}
    	}

    	const categoryTypes = writable([
    		new CategoryType('Season'),
    		new CategoryType('Holiday'),
    		new CategoryType('Style')
    	]);

    	validate_store(categoryTypes, 'categoryTypes');
    	component_subscribe($$self, categoryTypes, value => $$invalidate(10, $categoryTypes = value));

    	const categories = writable([
    		new Category('Spring', 'Season', ''),
    		new Category('Summer', 'Season', ''),
    		new Category('Fall', 'Season', 'product image, cozy, autumn, low lighting, brown hue, warm, soft, dim, golden, rustic, peaceful, inviting, intimate, quiet, serene, earthy, amber, glowing, tranquil, comforting, gentle, nostalgic.'),
    		new Category('Winter', 'Season', ''),
    		new Category('Easter', 'Holiday', ''),
    		new Category('Thanksgiving', 'Holiday', 'Cozy, modern kitchen interior with warm, even lighting, free of excessive highlights or mist. Rustic wooden cabinetry adorned with autumn decorations and a roasted turkey with other american thanksgiving foods, clear windows, and a festive atmosphere for Thanksgiving gatherings. Portraits of autumn on the wall.'),
    		new Category('Christmas', 'Holiday', 'Cozy, modern kitchen interior with warm, even lighting, without excessive highlights or mist. Rustic wooden cabinetry adorned with Christmas decorations, clear windows, and a cheerful atmosphere.'),
    		new Category('Mordern', 'Style', ''),
    		new Category('American', 'Style', ''),
    		new Category('Traditional', 'Style', ''),
    		new Category('Industrial', 'Style', '')
    	]);

    	validate_store(categories, 'categories');
    	component_subscribe($$self, categories, value => $$invalidate(3, $categories = value));

    	function toggleDropdown(dropdown) {
    		categoryTypes.update(dropdowns => {
    			dropdown.isOpen = !dropdown.isOpen;
    			return dropdowns;
    		});
    	}

    	// Activate one category and deactivate all the other of the same type. Lite stökig funktion men what the hell, den funkar
    	function toggleCategory(category) {
    		categories.update(cats => {
    			// If the selected category is already active, deactivate all categories of that type
    			if (category.isActive) {
    				cats.forEach(cat => {
    					if (cat.type === category.type) {
    						cat.isActive = false;
    					}
    				});
    			} else // If the selected category is inactive, activate it and deactivate others of the same type
    			{
    				cats.forEach(cat => {
    					if (cat.type === category.type) {
    						cat.isActive = cat.name === category.name;
    					}
    				});
    			}

    			return cats;
    		});
    	}

    	// Only deactivate the selected category. Same, lite stökig
    	function deactivateCategory(category) {
    		categories.update(cats => {
    			category.isActive = false;
    			return cats;
    		});
    	}

    	function handleFileDrop(event) {
    		const file = event.target.files[0];

    		if (file) {
    			$$invalidate(0, imageFile = file);
    		}
    	}

    	async function handleGenerate() {
    		$$invalidate(1, isLoading = true);

    		try {
    			const generatedImage = await uploadImage(imageFile, promptList, advancedSettings.find(setting => setting.name === 'Steps').value, advancedSettings.find(setting => setting.name === 'CFG').value, advancedSettings.find(setting => setting.name === 'Denoise').value, advancedSettings.find(setting => setting.name === 'Width').value, advancedSettings.find(setting => setting.name === 'Height').value, negativePrompt); //setting is object in array and find itterates over the array
    			isGenerated.set(true);
    			$$invalidate(20, genImageFile = generatedImage);
    		} catch(error) {
    			console.error('Error generating image:', error);
    		} finally {
    			$$invalidate(1, isLoading = false);
    		}
    	}

    	// Custom Settings and default values
    	class AdvancedSetting {
    		constructor(name, value, min, max, step, descrition) {
    			this.name = name;
    			this.value = value;
    			this.min = min;
    			this.max = max;
    			this.step = step;
    			this.descrition = descrition;
    			this.showTooltip = false;
    		}
    	}

    	let advancedSettings = [
    		new AdvancedSetting('Width', 1024, 100, 1600, 10, 'Width in pixels of the generated image.'),
    		new AdvancedSetting('Height', 1024, 100, 1600, 10, 'Height in pixels of the generated image.'),
    		new AdvancedSetting('CFG', 7, 0, 100, 1, 'Classifier-Free Guidance (CFG) Scale controls how much your prompt influences the output. High values ensure close adherence, while lower values allow more creativity. Avoid maxing CFG to maintain a balanced result.'),
    		new AdvancedSetting('Steps', 20, 1, 100, 1, 'Each step removes noise, enhancing image quality. More steps can improve results, but theres no need to max them out.'),
    		new AdvancedSetting('Denoise', 0.7, 0, 1, 0.1, 'Adjusts the amount of noise in the image. Less noise keeps the image closer to the original, while more noise allows for greater variation.')
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = categoryType => toggleDropdown(categoryType);
    	const func = (categoryType, category) => category.type === categoryType.name;
    	const click_handler_1 = category => toggleCategory(category);
    	const mouseenter_handler = (setting, each_value_1, setting_index) => $$invalidate(4, each_value_1[setting_index].showTooltip = true, advancedSettings);
    	const mouseleave_handler = (setting, each_value_1, setting_index) => $$invalidate(4, each_value_1[setting_index].showTooltip = false, advancedSettings);

    	function input0_change_input_handler(each_value_1, setting_index) {
    		each_value_1[setting_index].value = to_number(this.value);
    		$$invalidate(4, advancedSettings);
    	}

    	function input1_input_handler(each_value_1, setting_index) {
    		each_value_1[setting_index].value = to_number(this.value);
    		$$invalidate(4, advancedSettings);
    	}

    	const blur_handler = (setting, each_value_1, setting_index, e) => {
    		e.target.classList.remove('outline-white');
    		let value = parseFloat(e.target.value);
    		let invalid = false;

    		if (isNaN(value) || e.target.value === '') {
    			e.target.value = setting.min;
    			$$invalidate(4, each_value_1[setting_index].value = setting.min, advancedSettings);
    			invalid = true;
    		} else if (value < setting.min) {
    			e.target.value = setting.min;
    			$$invalidate(4, each_value_1[setting_index].value = setting.min, advancedSettings);
    			invalid = true;
    		} else if (value > setting.max) {
    			e.target.value = setting.max;
    			$$invalidate(4, each_value_1[setting_index].value = setting.max, advancedSettings);
    			invalid = true;
    		} else {
    			$$invalidate(4, each_value_1[setting_index].value = value, advancedSettings);
    			e.target.classList.remove('outline', 'outline-red-500', 'outline-transparent');
    		}

    		if (invalid) {
    			e.target.classList.add('outline', 'outline-red-500');

    			setTimeout(
    				() => {
    					e.target.classList.replace('outline-red-500', 'outline-transparent');

    					setTimeout(
    						() => {
    							e.target.classList.remove('outline', 'outline-transparent');
    						},
    						2000
    					);
    				},
    				500
    			);
    		}
    	};

    	const click_handler_2 = category => deactivateCategory(category);

    	function textarea_input_handler() {
    		negativePrompt = this.value;
    		$$invalidate(2, negativePrompt);
    	}

    	const click_handler_3 = () => handleGenerate();
    	const click_handler_4 = () => isGenerated.set(false);

    	$$self.$capture_state = () => ({
    		uploadImage,
    		debug,
    		writable,
    		get: get_store_value,
    		Check,
    		Cross,
    		imageFile,
    		isLoading,
    		negativePrompt,
    		genImageFile,
    		isGenerated,
    		CategoryType,
    		Category,
    		categoryTypes,
    		categories,
    		toggleDropdown,
    		toggleCategory,
    		deactivateCategory,
    		handleFileDrop,
    		handleGenerate,
    		AdvancedSetting,
    		advancedSettings,
    		promptList,
    		genImageSrc,
    		buttonText,
    		isGenerateDisabled,
    		imageSrc,
    		wordCount,
    		$categories,
    		$categoryTypes,
    		$isGenerated
    	});

    	$$self.$inject_state = $$props => {
    		if ('imageFile' in $$props) $$invalidate(0, imageFile = $$props.imageFile);
    		if ('isLoading' in $$props) $$invalidate(1, isLoading = $$props.isLoading);
    		if ('negativePrompt' in $$props) $$invalidate(2, negativePrompt = $$props.negativePrompt);
    		if ('genImageFile' in $$props) $$invalidate(20, genImageFile = $$props.genImageFile);
    		if ('isGenerated' in $$props) $$invalidate(12, isGenerated = $$props.isGenerated);
    		if ('advancedSettings' in $$props) $$invalidate(4, advancedSettings = $$props.advancedSettings);
    		if ('promptList' in $$props) promptList = $$props.promptList;
    		if ('genImageSrc' in $$props) $$invalidate(5, genImageSrc = $$props.genImageSrc);
    		if ('buttonText' in $$props) $$invalidate(6, buttonText = $$props.buttonText);
    		if ('isGenerateDisabled' in $$props) $$invalidate(7, isGenerateDisabled = $$props.isGenerateDisabled);
    		if ('imageSrc' in $$props) $$invalidate(8, imageSrc = $$props.imageSrc);
    		if ('wordCount' in $$props) $$invalidate(9, wordCount = $$props.wordCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$categories*/ 8) {
    			promptList = $categories.filter(category => category.isActive).map(category => category.prompt).join(', ');
    		}

    		if ($$self.$$.dirty[0] & /*negativePrompt*/ 4) {
    			$$invalidate(9, wordCount = negativePrompt.trim() === ''
    			? 0
    			: negativePrompt.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean).length);
    		}

    		if ($$self.$$.dirty[0] & /*imageFile*/ 1) {
    			$$invalidate(8, imageSrc = imageFile ? URL.createObjectURL(imageFile) : '');
    		}

    		if ($$self.$$.dirty[0] & /*imageFile, $categories, isLoading*/ 11) {
    			$$invalidate(7, isGenerateDisabled = !imageFile || !$categories.some(category => category.isActive) || isLoading);
    		}

    		if ($$self.$$.dirty[0] & /*isLoading*/ 2) {
    			$$invalidate(6, buttonText = isLoading ? 'Generating...' : 'Generate');
    		}

    		if ($$self.$$.dirty[0] & /*genImageFile*/ 1048576) {
    			$$invalidate(5, genImageSrc = genImageFile);
    		}
    	};

    	return [
    		imageFile,
    		isLoading,
    		negativePrompt,
    		$categories,
    		advancedSettings,
    		genImageSrc,
    		buttonText,
    		isGenerateDisabled,
    		imageSrc,
    		wordCount,
    		$categoryTypes,
    		$isGenerated,
    		isGenerated,
    		categoryTypes,
    		categories,
    		toggleDropdown,
    		toggleCategory,
    		deactivateCategory,
    		handleFileDrop,
    		handleGenerate,
    		genImageFile,
    		click_handler,
    		func,
    		click_handler_1,
    		mouseenter_handler,
    		mouseleave_handler,
    		input0_change_input_handler,
    		input1_input_handler,
    		blur_handler,
    		click_handler_2,
    		textarea_input_handler,
    		click_handler_3,
    		click_handler_4
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
