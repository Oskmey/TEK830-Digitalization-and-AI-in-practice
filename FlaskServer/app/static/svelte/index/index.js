
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

    async function uploadImage(image, promptList, sampler = "Euler a", steps=20, cfg_scale=7.0, denoising_strength=0.7, width=1024, height=1024) {
        const formData = new FormData();
        const promptListAdj = new Array();
        const resultPrompt = [];
        
        for (let category of promptList) {
            for (let [key, value] of Object.entries(category)) {
                if (value) {
                    promptListAdj.push(key);
                }
            }
        }
        

        promptListAdj.forEach(element => {
            switch (element) {
              case "spring":
                resultPrompt.push("fresh, good lighting, clean");
                break;

                case "fall":
                resultPrompt.push("product image, cozy, autumn, low lighting, brown hue, warm, soft, dim, golden, rustic, peaceful, inviting, intimate, quiet, serene, earthy, amber, glowing, tranquil, comforting, gentle, nostalgic.");
                break;
            }
          });
        

        formData.append('image', image);
        formData.append('prompt', resultPrompt);
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
      
          if (data.image) {
            return data.image;
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

    /* app/static/svelte/svg/Check.svelte generated by Svelte v3.59.2 */

    const file$2 = "app/static/svelte/svg/Check.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z");
    			add_location(path, file$2, 2, 4, 117);
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

    /* app/static/svelte/svg/Cross.svelte generated by Svelte v3.59.2 */

    const file$1 = "app/static/svelte/svg/Cross.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z");
    			add_location(path, file$1, 6, 4, 134);
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

    /* app/svelte/index/App.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "app/svelte/index/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[43] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[46] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[49] = list[i];
    	child_ctx[50] = list;
    	child_ctx[51] = i;
    	return child_ctx;
    }

    // (149:4) {#if dropdowns.season}
    function create_if_block_14(ctx) {
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
    	let if_block0 = /*$seasons*/ ctx[7].spring && create_if_block_18(ctx);
    	let if_block1 = /*$seasons*/ ctx[7].summer && create_if_block_17(ctx);
    	let if_block2 = /*$seasons*/ ctx[7].fall && create_if_block_16(ctx);
    	let if_block3 = /*$seasons*/ ctx[7].winter && create_if_block_15(ctx);

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
    			add_location(button0, file, 150, 23, 4510);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 150, 6, 4493);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 151, 23, 4752);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 151, 6, 4735);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 152, 23, 4994);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 152, 6, 4977);
    			attr_dev(button3, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button3, file, 153, 23, 5230);
    			attr_dev(li3, "class", "ml-8");
    			add_location(li3, file, 153, 6, 5213);
    			add_location(ul, file, 149, 5, 4482);
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
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[17], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[18], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[19], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_4*/ ctx[20], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$seasons*/ ctx[7].spring) {
    				if (if_block0) {
    					if (dirty[0] & /*$seasons*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_18(ctx);
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

    			if (/*$seasons*/ ctx[7].summer) {
    				if (if_block1) {
    					if (dirty[0] & /*$seasons*/ 128) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_17(ctx);
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

    			if (/*$seasons*/ ctx[7].fall) {
    				if (if_block2) {
    					if (dirty[0] & /*$seasons*/ 128) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_16(ctx);
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

    			if (/*$seasons*/ ctx[7].winter) {
    				if (if_block3) {
    					if (dirty[0] & /*$seasons*/ 128) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_15(ctx);
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
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(149:4) {#if dropdowns.season}",
    		ctx
    	});

    	return block;
    }

    // (151:193) {#if $seasons.spring}
    function create_if_block_18(ctx) {
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
    		id: create_if_block_18.name,
    		type: "if",
    		source: "(151:193) {#if $seasons.spring}",
    		ctx
    	});

    	return block;
    }

    // (152:193) {#if $seasons.summer}
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
    		source: "(152:193) {#if $seasons.summer}",
    		ctx
    	});

    	return block;
    }

    // (153:189) {#if $seasons.fall}
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
    		source: "(153:189) {#if $seasons.fall}",
    		ctx
    	});

    	return block;
    }

    // (154:193) {#if $seasons.winter}
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
    		source: "(154:193) {#if $seasons.winter}",
    		ctx
    	});

    	return block;
    }

    // (165:4) {#if dropdowns.holiday}
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
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$holiday*/ ctx[8].easter && create_if_block_13(ctx);
    	let if_block1 = /*$holiday*/ ctx[8].thanksgiving && create_if_block_12(ctx);
    	let if_block2 = /*$holiday*/ ctx[8].christmas && create_if_block_11(ctx);

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
    			add_location(button0, file, 166, 23, 6036);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 166, 6, 6019);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 167, 23, 6278);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 167, 6, 6261);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 168, 23, 6538);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 168, 6, 6521);
    			add_location(ul, file, 165, 5, 6008);
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
    					listen_dev(button0, "click", /*click_handler_6*/ ctx[22], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_7*/ ctx[23], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_8*/ ctx[24], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$holiday*/ ctx[8].easter) {
    				if (if_block0) {
    					if (dirty[0] & /*$holiday*/ 256) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_13(ctx);
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

    			if (/*$holiday*/ ctx[8].thanksgiving) {
    				if (if_block1) {
    					if (dirty[0] & /*$holiday*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_12(ctx);
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

    			if (/*$holiday*/ ctx[8].christmas) {
    				if (if_block2) {
    					if (dirty[0] & /*$holiday*/ 256) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_11(ctx);
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
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(165:4) {#if dropdowns.holiday}",
    		ctx
    	});

    	return block;
    }

    // (167:193) {#if $holiday.easter}
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
    		source: "(167:193) {#if $holiday.easter}",
    		ctx
    	});

    	return block;
    }

    // (168:205) {#if $holiday.thanksgiving}
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
    		source: "(168:205) {#if $holiday.thanksgiving}",
    		ctx
    	});

    	return block;
    }

    // (169:199) {#if $holiday.christmas}
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
    		source: "(169:199) {#if $holiday.christmas}",
    		ctx
    	});

    	return block;
    }

    // (180:4) {#if dropdowns.style}
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
    	let if_block0 = /*$style*/ ctx[9].modern && create_if_block_9(ctx);
    	let if_block1 = /*$style*/ ctx[9].old && create_if_block_8(ctx);
    	let if_block2 = /*$style*/ ctx[9].trash && create_if_block_7(ctx);

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
    			add_location(button0, file, 181, 23, 7346);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 181, 6, 7329);
    			attr_dev(button1, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 182, 23, 7584);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 182, 6, 7567);
    			attr_dev(button2, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 183, 23, 7813);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 183, 6, 7796);
    			add_location(ul, file, 180, 5, 7318);
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
    					listen_dev(button0, "click", /*click_handler_10*/ ctx[26], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_11*/ ctx[27], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_12*/ ctx[28], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*$style*/ ctx[9].modern) {
    				if (if_block0) {
    					if (dirty[0] & /*$style*/ 512) {
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

    			if (/*$style*/ ctx[9].old) {
    				if (if_block1) {
    					if (dirty[0] & /*$style*/ 512) {
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

    			if (/*$style*/ ctx[9].trash) {
    				if (if_block2) {
    					if (dirty[0] & /*$style*/ 512) {
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
    		source: "(180:4) {#if dropdowns.style}",
    		ctx
    	});

    	return block;
    }

    // (182:191) {#if $style.modern}
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
    		source: "(182:191) {#if $style.modern}",
    		ctx
    	});

    	return block;
    }

    // (183:185) {#if $style.old}
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
    		source: "(183:185) {#if $style.old}",
    		ctx
    	});

    	return block;
    }

    // (184:189) {#if $style.trash}
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
    		source: "(184:189) {#if $style.trash}",
    		ctx
    	});

    	return block;
    }

    // (201:6) {#if setting.showTooltip}
    function create_if_block_5(ctx) {
    	let div;
    	let t_value = /*setting*/ ctx[49].descrition + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "absolute w-52 bottom-full transform -translate-x-0 mb-2 bg-dark-200 border border-white drop-shadow-xl text-xs text-left p-2 rounded shadow-lg z-10");
    			add_location(div, file, 201, 7, 8644);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*advancedSettings*/ 8 && t_value !== (t_value = /*setting*/ ctx[49].descrition + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(201:6) {#if setting.showTooltip}",
    		ctx
    	});

    	return block;
    }

    // (194:3) {#each advancedSettings as setting}
    function create_each_block_3(ctx) {
    	let li;
    	let div;
    	let p0;
    	let t0_value = /*setting*/ ctx[49].name + "";
    	let t0;
    	let t1;
    	let t2;
    	let input;
    	let input_min_value;
    	let input_max_value;
    	let input_step_value;
    	let t3;
    	let p1;
    	let t4_value = /*setting*/ ctx[49].value + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;
    	let if_block = /*setting*/ ctx[49].showTooltip && create_if_block_5(ctx);

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[29](/*setting*/ ctx[49], /*each_value_3*/ ctx[50], /*setting_index*/ ctx[51]);
    	}

    	function mouseleave_handler() {
    		return /*mouseleave_handler*/ ctx[30](/*setting*/ ctx[49], /*each_value_3*/ ctx[50], /*setting_index*/ ctx[51]);
    	}

    	function input_change_input_handler() {
    		/*input_change_input_handler*/ ctx[31].call(input, /*each_value_3*/ ctx[50], /*setting_index*/ ctx[51]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			p1 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(p0, "class", "w-[7ch] text-left");
    			add_location(p0, file, 198, 6, 8550);
    			attr_dev(div, "class", "relative inline-block hover:cursor-pointer");
    			add_location(div, file, 195, 5, 8374);
    			attr_dev(input, "class", "hover:cursor-pointer");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", input_min_value = /*setting*/ ctx[49].min);
    			attr_dev(input, "max", input_max_value = /*setting*/ ctx[49].max);
    			attr_dev(input, "step", input_step_value = /*setting*/ ctx[49].step);
    			add_location(input, file, 206, 5, 8890);
    			attr_dev(p1, "class", "text-right w-[4ch]");
    			add_location(p1, file, 207, 5, 9036);
    			attr_dev(li, "class", "flex justify-between items-center w-full p-2 gap-2 rounded");
    			add_location(li, file, 194, 4, 8297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(li, t2);
    			append_dev(li, input);
    			set_input_value(input, /*setting*/ ctx[49].value);
    			append_dev(li, t3);
    			append_dev(li, p1);
    			append_dev(p1, t4);
    			append_dev(li, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", mouseenter_handler, false, false, false, false),
    					listen_dev(div, "mouseleave", mouseleave_handler, false, false, false, false),
    					listen_dev(input, "change", input_change_input_handler),
    					listen_dev(input, "input", input_change_input_handler)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*advancedSettings*/ 8 && t0_value !== (t0_value = /*setting*/ ctx[49].name + "")) set_data_dev(t0, t0_value);

    			if (/*setting*/ ctx[49].showTooltip) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*advancedSettings*/ 8 && input_min_value !== (input_min_value = /*setting*/ ctx[49].min)) {
    				attr_dev(input, "min", input_min_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 8 && input_max_value !== (input_max_value = /*setting*/ ctx[49].max)) {
    				attr_dev(input, "max", input_max_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 8 && input_step_value !== (input_step_value = /*setting*/ ctx[49].step)) {
    				attr_dev(input, "step", input_step_value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 8) {
    				set_input_value(input, /*setting*/ ctx[49].value);
    			}

    			if (dirty[0] & /*advancedSettings*/ 8 && t4_value !== (t4_value = /*setting*/ ctx[49].value + "")) set_data_dev(t4, t4_value);
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
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(194:3) {#each advancedSettings as setting}",
    		ctx
    	});

    	return block;
    }

    // (217:3) {#if $seasons[season]}
    function create_if_block_4(ctx) {
    	let div;
    	let t0_value = /*season*/ ctx[46].charAt(0).toUpperCase() + /*season*/ ctx[46].slice(1) + "";
    	let t0;
    	let t1;
    	let button;
    	let cross;
    	let current;
    	let mounted;
    	let dispose;
    	cross = new Cross({ $$inline: true });

    	function click_handler_13() {
    		return /*click_handler_13*/ ctx[32](/*season*/ ctx[46]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			create_component(cross.$$.fragment);
    			attr_dev(button, "class", "rounded hover:bg-dark-200");
    			add_location(button, file, 219, 5, 9479);
    			attr_dev(div, "class", "flex justify-between bg-dark-200 items-center w-full p-2 mb-4 border border-white rounded");
    			add_location(div, file, 217, 4, 9277);
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
    			if ((!current || dirty[0] & /*$seasons*/ 128) && t0_value !== (t0_value = /*season*/ ctx[46].charAt(0).toUpperCase() + /*season*/ ctx[46].slice(1) + "")) set_data_dev(t0, t0_value);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(217:3) {#if $seasons[season]}",
    		ctx
    	});

    	return block;
    }

    // (216:2) {#each Object.keys($seasons) as season}
    function create_each_block_2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$seasons*/ ctx[7][/*season*/ ctx[46]] && create_if_block_4(ctx);

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
    			if (/*$seasons*/ ctx[7][/*season*/ ctx[46]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$seasons*/ 128) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4(ctx);
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
    		source: "(216:2) {#each Object.keys($seasons) as season}",
    		ctx
    	});

    	return block;
    }

    // (226:3) {#if $holiday[holi]}
    function create_if_block_3(ctx) {
    	let div;
    	let t0_value = /*holi*/ ctx[43].charAt(0).toUpperCase() + /*holi*/ ctx[43].slice(1) + "";
    	let t0;
    	let t1;
    	let button;
    	let cross;
    	let current;
    	let mounted;
    	let dispose;
    	cross = new Cross({ $$inline: true });

    	function click_handler_14() {
    		return /*click_handler_14*/ ctx[33](/*holi*/ ctx[43]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			create_component(cross.$$.fragment);
    			attr_dev(button, "class", "rounded hover:bg-dark-200");
    			add_location(button, file, 228, 5, 9877);
    			attr_dev(div, "class", "flex justify-between bg-dark-200 items-center w-full p-2 mb-4 border border-white rounded");
    			add_location(div, file, 226, 4, 9681);
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
    			if ((!current || dirty[0] & /*$holiday*/ 256) && t0_value !== (t0_value = /*holi*/ ctx[43].charAt(0).toUpperCase() + /*holi*/ ctx[43].slice(1) + "")) set_data_dev(t0, t0_value);
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
    		source: "(226:3) {#if $holiday[holi]}",
    		ctx
    	});

    	return block;
    }

    // (225:2) {#each Object.keys($holiday) as holi}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$holiday*/ ctx[8][/*holi*/ ctx[43]] && create_if_block_3(ctx);

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
    			if (/*$holiday*/ ctx[8][/*holi*/ ctx[43]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$holiday*/ 256) {
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(225:2) {#each Object.keys($holiday) as holi}",
    		ctx
    	});

    	return block;
    }

    // (235:3) {#if $style[key]}
    function create_if_block_2(ctx) {
    	let div;
    	let t0_value = /*key*/ ctx[40].charAt(0).toUpperCase() + /*key*/ ctx[40].slice(1) + "";
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
    		return /*click_handler_15*/ ctx[34](/*key*/ ctx[40]);
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
    			add_location(button, file, 237, 5, 10266);
    			attr_dev(div, "class", "flex justify-between bg-dark-200 items-center w-full p-2 mb-4 border border-white rounded");
    			add_location(div, file, 235, 4, 10071);
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
    			if ((!current || dirty[0] & /*$style*/ 512) && t0_value !== (t0_value = /*key*/ ctx[40].charAt(0).toUpperCase() + /*key*/ ctx[40].slice(1) + "")) set_data_dev(t0, t0_value);
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
    		source: "(235:3) {#if $style[key]}",
    		ctx
    	});

    	return block;
    }

    // (234:2) {#each Object.keys($style) as key}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$style*/ ctx[9][/*key*/ ctx[40]] && create_if_block_2(ctx);

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
    			if (/*$style*/ ctx[9][/*key*/ ctx[40]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$style*/ 512) {
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(234:2) {#each Object.keys($style) as key}",
    		ctx
    	});

    	return block;
    }

    // (249:3) {:else}
    function create_else_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*imageSrc*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "max-w-xs h-auto object-contain");
    			attr_dev(img, "id", "output");
    			set_style(img, "display", "block");
    			attr_dev(img, "alt", "Uploaded_image");
    			add_location(img, file, 249, 4, 10884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*imageSrc*/ 16 && !src_url_equal(img.src, img_src_value = /*imageSrc*/ ctx[4])) {
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
    		source: "(249:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (246:3) {#if !imageSrc}
    function create_if_block_1(ctx) {
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
    			add_location(h1, file, 246, 4, 10680);
    			attr_dev(p, "class", "text-xs");
    			add_location(p, file, 247, 4, 10784);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(246:3) {#if !imageSrc}",
    		ctx
    	});

    	return block;
    }

    // (261:3) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*buttonText*/ ctx[5]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*buttonText*/ 32) set_data_dev(t, /*buttonText*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(261:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (255:3) {#if isLoading}
    function create_if_block(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let t;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t = text("\n\t\t\t\tLoading...");
    			attr_dev(path0, "d", "M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z");
    			attr_dev(path0, "fill", "#E5E7EB");
    			add_location(path0, file, 256, 5, 11620);
    			attr_dev(path1, "d", "M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z");
    			attr_dev(path1, "fill", "currentColor");
    			add_location(path1, file, 257, 5, 12017);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "status");
    			attr_dev(svg, "class", "inline w-4 h-4 me-3 text-white animate-spin");
    			attr_dev(svg, "viewBox", "0 0 100 101");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file, 255, 4, 11455);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(255:3) {#if isLoading}",
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
    	let p0;
    	let t12;
    	let p1;
    	let t14;
    	let ul1;
    	let t15;
    	let section;
    	let t16;
    	let t17;
    	let t18;
    	let main;
    	let label;
    	let t19;
    	let input;
    	let t20;
    	let button3;
    	let button3_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*dropdowns*/ ctx[2].season && create_if_block_14(ctx);
    	let if_block1 = /*dropdowns*/ ctx[2].holiday && create_if_block_10(ctx);
    	let if_block2 = /*dropdowns*/ ctx[2].style && create_if_block_6(ctx);
    	let each_value_3 = /*advancedSettings*/ ctx[3];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = Object.keys(/*$seasons*/ ctx[7]);
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_1 = Object.keys(/*$holiday*/ ctx[8]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out_1 = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = Object.keys(/*$style*/ ctx[9]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_2 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function select_block_type(ctx, dirty) {
    		if (!/*imageSrc*/ ctx[4]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block3 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*isLoading*/ ctx[1]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block4 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			nav = element("nav");
    			h1 = element("h1");
    			h1.textContent = "PÅHITTIG";
    			t1 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			t2 = text("Season\n\t\t\t\t\t");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			li1 = element("li");
    			button1 = element("button");
    			t5 = text("Holiday\n\t\t\t\t\t");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			li2 = element("li");
    			button2 = element("button");
    			t8 = text("Style\n\t\t\t\t\t");
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

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t15 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t16 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t17 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t18 = space();
    			main = element("main");
    			label = element("label");
    			if_block3.c();
    			t19 = space();
    			input = element("input");
    			t20 = space();
    			button3 = element("button");
    			if_block4.c();
    			attr_dev(h1, "class", "p-2 text-5xl font-title tracking-widest font-bold");
    			add_location(h1, file, 140, 2, 3863);
    			attr_dev(path0, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path0, file, 146, 211, 4366);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "height", "16px");
    			attr_dev(svg0, "viewBox", "0 -960 960 960");
    			attr_dev(svg0, "width", "16px");
    			attr_dev(svg0, "fill", "#ffffff");
    			set_style(svg0, "transform", "rotate(" + (/*dropdowns*/ ctx[2].season ? '90deg' : '0deg') + ")");
    			set_style(svg0, "transition", "transform 0.3s ease");
    			add_location(svg0, file, 146, 5, 4160);
    			attr_dev(button0, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 144, 4, 3990);
    			add_location(li0, file, 143, 3, 3981);
    			attr_dev(path1, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path1, file, 162, 212, 5891);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "height", "16px");
    			attr_dev(svg1, "viewBox", "0 -960 960 960");
    			attr_dev(svg1, "width", "16px");
    			attr_dev(svg1, "fill", "#ffffff");
    			set_style(svg1, "transform", "rotate(" + (/*dropdowns*/ ctx[2].holiday ? '90deg' : '0deg') + ")");
    			set_style(svg1, "transition", "transform 0.3s ease");
    			add_location(svg1, file, 162, 5, 5684);
    			attr_dev(button1, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 160, 4, 5512);
    			add_location(li1, file, 159, 3, 5503);
    			attr_dev(path2, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path2, file, 177, 210, 7203);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "height", "16px");
    			attr_dev(svg2, "viewBox", "0 -960 960 960");
    			attr_dev(svg2, "width", "16px");
    			attr_dev(svg2, "fill", "#ffffff");
    			set_style(svg2, "transform", "rotate(" + (/*dropdowns*/ ctx[2].style ? '90deg' : '0deg') + ")");
    			set_style(svg2, "transition", "transform 0.3s ease");
    			add_location(svg2, file, 177, 5, 6998);
    			attr_dev(button2, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 175, 4, 6830);
    			add_location(li2, file, 174, 3, 6821);
    			attr_dev(ul0, "class", "mt-8");
    			add_location(ul0, file, 141, 2, 3941);
    			attr_dev(p0, "class", "text-left p-2 mt-8");
    			add_location(p0, file, 190, 2, 8095);
    			attr_dev(p1, "class", "text-left px-2 mb-4 text-xs text-gray-500");
    			add_location(p1, file, 191, 2, 8149);
    			add_location(ul1, file, 192, 2, 8249);
    			attr_dev(nav, "class", "min-h-max bg-dark-200 text-white p-4 text-base border-r text-center");
    			add_location(nav, file, 139, 1, 3779);
    			attr_dev(section, "class", "w-1/5 h-full bg-black text-white p-4");
    			add_location(section, file, 214, 1, 9150);
    			attr_dev(label, "for", "filepicker");
    			attr_dev(label, "class", "px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100 cursor-pointer");
    			add_location(label, file, 244, 2, 10513);
    			attr_dev(input, "type", "file");
    			attr_dev(input, "accept", "image/**");
    			attr_dev(input, "id", "filepicker");
    			set_style(input, "display", "none");
    			add_location(input, file, 252, 2, 11024);
    			attr_dev(button3, "type", "button");

    			attr_dev(button3, "class", button3_class_value = "mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out " + (/*isGenerateDisabled*/ ctx[6]
    			? 'opacity-50 cursor-not-allowed'
    			: 'hover:bg-dark-100 cursor-pointer'));

    			button3.disabled = /*isGenerateDisabled*/ ctx[6];
    			add_location(button3, file, 253, 2, 11132);
    			attr_dev(main, "class", "flex flex-col items-center justify-center h-screen w-full bg-black text-white font-body");
    			add_location(main, file, 243, 1, 10408);
    			attr_dev(div, "class", "flex min-h-screen max-w-screen bg-black");
    			add_location(div, file, 138, 0, 3724);
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
    			append_dev(nav, p0);
    			append_dev(nav, t12);
    			append_dev(nav, p1);
    			append_dev(nav, t14);
    			append_dev(nav, ul1);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				if (each_blocks_3[i]) {
    					each_blocks_3[i].m(ul1, null);
    				}
    			}

    			append_dev(div, t15);
    			append_dev(div, section);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(section, null);
    				}
    			}

    			append_dev(section, t16);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(section, null);
    				}
    			}

    			append_dev(section, t17);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(section, null);
    				}
    			}

    			append_dev(div, t18);
    			append_dev(div, main);
    			append_dev(main, label);
    			if_block3.m(label, null);
    			append_dev(main, t19);
    			append_dev(main, input);
    			append_dev(main, t20);
    			append_dev(main, button3);
    			if_block4.m(button3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[16], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[21], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_9*/ ctx[25], false, false, false, false),
    					listen_dev(input, "change", /*handleFileDrop*/ ctx[14], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_16*/ ctx[35], false, false, false, false)
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
    					if_block0 = create_if_block_14(ctx);
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
    					if_block1 = create_if_block_10(ctx);
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
    					if_block2 = create_if_block_6(ctx);
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

    			if (dirty[0] & /*advancedSettings*/ 8) {
    				each_value_3 = /*advancedSettings*/ ctx[3];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*seasons, $seasons*/ 2176) {
    				each_value_2 = Object.keys(/*$seasons*/ ctx[7]);
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
    						each_blocks_2[i].m(section, t16);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*holiday, $holiday*/ 4352) {
    				each_value_1 = Object.keys(/*$holiday*/ ctx[8]);
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
    						each_blocks_1[i].m(section, t17);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (dirty[0] & /*style, $style*/ 8704) {
    				each_value = Object.keys(/*$style*/ ctx[9]);
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

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block3) {
    				if_block3.p(ctx, dirty);
    			} else {
    				if_block3.d(1);
    				if_block3 = current_block_type(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(label, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block4) {
    				if_block4.p(ctx, dirty);
    			} else {
    				if_block4.d(1);
    				if_block4 = current_block_type_1(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(button3, null);
    				}
    			}

    			if (!current || dirty[0] & /*isGenerateDisabled*/ 64 && button3_class_value !== (button3_class_value = "mt-16 text-white text-3xl py-2 px-4 bg-dark-200 border border-white rounded-lg transition ease-in-out " + (/*isGenerateDisabled*/ ctx[6]
    			? 'opacity-50 cursor-not-allowed'
    			: 'hover:bg-dark-100 cursor-pointer'))) {
    				attr_dev(button3, "class", button3_class_value);
    			}

    			if (!current || dirty[0] & /*isGenerateDisabled*/ 64) {
    				prop_dev(button3, "disabled", /*isGenerateDisabled*/ ctx[6]);
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
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if_block3.d();
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
    	let imageSrc;
    	let isGenerateDisabled;
    	let buttonText;
    	let $seasons;
    	let $holiday;
    	let $style;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let imageFile = null;
    	let isLoading = false;

    	let dropdowns = {
    		season: false,
    		holiday: false,
    		style: false,
    		cfg: false
    	};

    	class Option {
    		constructor(isActive, name, prompt) {
    			this.isActive = isActive;
    			this.name = name;
    			this.prompt = prompt;
    		}
    	}

    	function toggleDropdown(key) {
    		$$invalidate(2, dropdowns[key] = !dropdowns[key], dropdowns);
    	}

    	// All categories
    	// spring: new Option("spring", "fresh, new, cool", false)
    	let seasons = writable({
    		spring: false,
    		summer: false,
    		fall: false,
    		winter: false
    	});

    	validate_store(seasons, 'seasons');
    	component_subscribe($$self, seasons, value => $$invalidate(7, $seasons = value));

    	let holiday = writable({
    		easter: false,
    		thanksgiving: false,
    		christmas: false
    	});

    	validate_store(holiday, 'holiday');
    	component_subscribe($$self, holiday, value => $$invalidate(8, $holiday = value));
    	let style = writable({ modern: false, old: false, trash: false });
    	validate_store(style, 'style');
    	component_subscribe($$self, style, value => $$invalidate(9, $style = value));

    	function handleFileDrop(event) {
    		const file = event.target.files[0];

    		if (file) {
    			$$invalidate(0, imageFile = file);
    		}
    	}

    	async function handleGenerate() {
    		$$invalidate(1, isLoading = true);

    		try {
    			const generatedImage = await uploadImage(imageFile);
    			$$invalidate(4, imageSrc = generatedImage);
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
    		new AdvancedSetting('Width', 800, 100, 1600, 10, 'Width... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
    		new AdvancedSetting('Height', 800, 100, 1600, 10, 'Height... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
    		new AdvancedSetting('CFG', 20, 0, 100, 1, 'CFG... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
    		new AdvancedSetting('Steps', 20, 1, 100, 1, 'Steps... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.'),
    		new AdvancedSetting('Denoise', 0.7, 0, 1, 0.1, 'Denoise... lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lacinia mauris nec libero auctor, eu dapibus augue pellentesque.')
    	];

    	// Read me
    	let readMeDescription = '';

    	let readMeToolTip = false;
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
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
    	const mouseenter_handler = (setting, each_value_3, setting_index) => $$invalidate(3, each_value_3[setting_index].showTooltip = true, advancedSettings);
    	const mouseleave_handler = (setting, each_value_3, setting_index) => $$invalidate(3, each_value_3[setting_index].showTooltip = false, advancedSettings);

    	function input_change_input_handler(each_value_3, setting_index) {
    		each_value_3[setting_index].value = to_number(this.value);
    		$$invalidate(3, advancedSettings);
    	}

    	const click_handler_13 = season => setFalse(seasons, season);
    	const click_handler_14 = holi => setFalse(holiday, holi);
    	const click_handler_15 = key => setFalse(style, key);
    	const click_handler_16 = () => handleGenerate();

    	$$self.$capture_state = () => ({
    		fileDrop,
    		uploadImage,
    		debug,
    		writable,
    		get: get_store_value,
    		Check,
    		Cross,
    		imageFile,
    		isLoading,
    		dropdowns,
    		Option,
    		toggleDropdown,
    		seasons,
    		holiday,
    		style,
    		setTrue,
    		setFalse,
    		handleFileDrop,
    		handleGenerate,
    		AdvancedSetting,
    		advancedSettings,
    		readMeDescription,
    		readMeToolTip,
    		imageSrc,
    		buttonText,
    		isGenerateDisabled,
    		$seasons,
    		$holiday,
    		$style
    	});

    	$$self.$inject_state = $$props => {
    		if ('imageFile' in $$props) $$invalidate(0, imageFile = $$props.imageFile);
    		if ('isLoading' in $$props) $$invalidate(1, isLoading = $$props.isLoading);
    		if ('dropdowns' in $$props) $$invalidate(2, dropdowns = $$props.dropdowns);
    		if ('seasons' in $$props) $$invalidate(11, seasons = $$props.seasons);
    		if ('holiday' in $$props) $$invalidate(12, holiday = $$props.holiday);
    		if ('style' in $$props) $$invalidate(13, style = $$props.style);
    		if ('advancedSettings' in $$props) $$invalidate(3, advancedSettings = $$props.advancedSettings);
    		if ('readMeDescription' in $$props) readMeDescription = $$props.readMeDescription;
    		if ('readMeToolTip' in $$props) readMeToolTip = $$props.readMeToolTip;
    		if ('imageSrc' in $$props) $$invalidate(4, imageSrc = $$props.imageSrc);
    		if ('buttonText' in $$props) $$invalidate(5, buttonText = $$props.buttonText);
    		if ('isGenerateDisabled' in $$props) $$invalidate(6, isGenerateDisabled = $$props.isGenerateDisabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*imageFile*/ 1) {
    			$$invalidate(4, imageSrc = imageFile ? URL.createObjectURL(imageFile) : '');
    		}

    		if ($$self.$$.dirty[0] & /*imageFile, isLoading*/ 3) {
    			$$invalidate(6, isGenerateDisabled = !imageFile || isLoading);
    		}

    		if ($$self.$$.dirty[0] & /*isLoading*/ 2) {
    			$$invalidate(5, buttonText = isLoading ? 'Generating...' : 'Generate');
    		}
    	};

    	return [
    		imageFile,
    		isLoading,
    		dropdowns,
    		advancedSettings,
    		imageSrc,
    		buttonText,
    		isGenerateDisabled,
    		$seasons,
    		$holiday,
    		$style,
    		toggleDropdown,
    		seasons,
    		holiday,
    		style,
    		handleFileDrop,
    		handleGenerate,
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
    		input_change_input_handler,
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
