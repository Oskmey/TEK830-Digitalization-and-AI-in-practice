
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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

    /* app\svelte\index\App.svelte generated by Svelte v3.59.2 */

    const file = "app\\svelte\\index\\App.svelte";

    // (60:4) {#if dropdowns.season}
    function create_if_block_5(ctx) {
    	let ul;
    	let li0;
    	let button0;
    	let t1;
    	let li1;
    	let button1;
    	let t3;
    	let li2;
    	let button2;
    	let t5;
    	let li3;
    	let button3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			button0.textContent = "Spring";
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "Summer";
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			button2.textContent = "Fall";
    			t5 = space();
    			li3 = element("li");
    			button3 = element("button");
    			button3.textContent = "Winter";
    			attr_dev(button0, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 61, 23, 1542);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 61, 6, 1525);
    			attr_dev(button1, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 62, 23, 1717);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 62, 6, 1700);
    			attr_dev(button2, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 63, 23, 1893);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 63, 6, 1876);
    			attr_dev(button3, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button3, file, 64, 23, 2065);
    			attr_dev(li3, "class", "ml-8");
    			add_location(li3, file, 64, 6, 2048);
    			add_location(ul, file, 60, 5, 1513);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(li3, button3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[5], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[6], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[7], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_4*/ ctx[8], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(60:4) {#if dropdowns.season}",
    		ctx
    	});

    	return block;
    }

    // (76:4) {#if dropdowns.holiday}
    function create_if_block_3(ctx) {
    	let ul;
    	let li0;
    	let button0;
    	let t0;
    	let t1;
    	let li1;
    	let button1;
    	let t3;
    	let li2;
    	let button2;
    	let mounted;
    	let dispose;
    	let if_block = /*holiday*/ ctx[3].easter && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			t0 = text("Easter");
    			if (if_block) if_block.c();
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "Thanksgiving";
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			button2.textContent = "Christmas";
    			attr_dev(button0, "class", "flex justify-between items-center w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 77, 23, 2817);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 77, 6, 2800);
    			attr_dev(button1, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 78, 23, 3229);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 78, 6, 3212);
    			attr_dev(button2, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 79, 23, 3418);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 79, 6, 3401);
    			add_location(ul, file, 76, 5, 2788);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(button0, t0);
    			if (if_block) if_block.m(button0, null);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_6*/ ctx[10], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_7*/ ctx[11], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_8*/ ctx[12], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(76:4) {#if dropdowns.holiday}",
    		ctx
    	});

    	return block;
    }

    // (78:193) {#if holiday.easter}
    function create_if_block_4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z");
    			add_location(path, file, 77, 320, 3114);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "20px");
    			attr_dev(svg, "viewBox", "0 -960 960 960");
    			attr_dev(svg, "width", "20px");
    			attr_dev(svg, "fill", "#ffffff");
    			add_location(svg, file, 77, 213, 3007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(78:193) {#if holiday.easter}",
    		ctx
    	});

    	return block;
    }

    // (91:4) {#if dropdowns.style}
    function create_if_block_2(ctx) {
    	let ul;
    	let li0;
    	let button0;
    	let t1;
    	let li1;
    	let button1;
    	let t3;
    	let li2;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			button0.textContent = "Modern";
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "Old";
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			button2.textContent = "Trash";
    			attr_dev(button0, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 92, 23, 4170);
    			attr_dev(li0, "class", "ml-8");
    			add_location(li0, file, 92, 6, 4153);
    			attr_dev(button1, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 93, 23, 4345);
    			attr_dev(li1, "class", "ml-8");
    			add_location(li1, file, 93, 6, 4328);
    			attr_dev(button2, "class", "w-full text-left p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 94, 23, 4514);
    			attr_dev(li2, "class", "ml-8");
    			add_location(li2, file, 94, 6, 4497);
    			add_location(ul, file, 91, 5, 4141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_10*/ ctx[14], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_11*/ ctx[15], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_12*/ ctx[16], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(91:4) {#if dropdowns.style}",
    		ctx
    	});

    	return block;
    }

    // (110:4) {#if dropdowns.cfg}
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Nothing here yet.";
    			add_location(p, file, 111, 6, 5348);
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
    		source: "(110:4) {#if dropdowns.cfg}",
    		ctx
    	});

    	return block;
    }

    // (124:2) {#if seasons.spring}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "py-8 px-32 mt-32 bg-white");
    			add_location(div, file, 124, 3, 5890);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(124:2) {#if seasons.spring}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let nav;
    	let h10;
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
    	let ul1;
    	let li3;
    	let button3;
    	let t13;
    	let svg3;
    	let path3;
    	let t14;
    	let t15;
    	let main;
    	let button4;
    	let h11;
    	let t17;
    	let p1;
    	let t19;
    	let mounted;
    	let dispose;
    	let if_block0 = /*dropdowns*/ ctx[0].season && create_if_block_5(ctx);
    	let if_block1 = /*dropdowns*/ ctx[0].holiday && create_if_block_3(ctx);
    	let if_block2 = /*dropdowns*/ ctx[0].style && create_if_block_2(ctx);
    	let if_block3 = /*dropdowns*/ ctx[0].cfg && create_if_block_1(ctx);
    	let if_block4 = /*seasons*/ ctx[2].spring && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			nav = element("nav");
    			h10 = element("h1");
    			h10.textContent = "KRAFT";
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
    			p0.textContent = "Custom Settings";
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
    			button4 = element("button");
    			h11 = element("h1");
    			h11.textContent = "Click to add image";
    			t17 = space();
    			p1 = element("p");
    			p1.textContent = "The image should contain your product with a white background";
    			t19 = space();
    			if (if_block4) if_block4.c();
    			attr_dev(h10, "class", "p-2 text-5xl font-title tracking-widest font-bold");
    			add_location(h10, file, 51, 2, 888);
    			attr_dev(path0, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path0, file, 57, 211, 1394);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "height", "16px");
    			attr_dev(svg0, "viewBox", "0 -960 960 960");
    			attr_dev(svg0, "width", "16px");
    			attr_dev(svg0, "fill", "#ffffff");
    			set_style(svg0, "transform", "rotate(" + (/*dropdowns*/ ctx[0].season ? '90deg' : '0deg') + ")");
    			set_style(svg0, "transition", "transform 0.3s ease");
    			add_location(svg0, file, 57, 5, 1188);
    			attr_dev(button0, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button0, file, 55, 4, 1016);
    			add_location(li0, file, 54, 3, 1006);
    			attr_dev(path1, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path1, file, 73, 212, 2668);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "height", "16px");
    			attr_dev(svg1, "viewBox", "0 -960 960 960");
    			attr_dev(svg1, "width", "16px");
    			attr_dev(svg1, "fill", "#ffffff");
    			set_style(svg1, "transform", "rotate(" + (/*dropdowns*/ ctx[0].holiday ? '90deg' : '0deg') + ")");
    			set_style(svg1, "transition", "transform 0.3s ease");
    			add_location(svg1, file, 73, 5, 2461);
    			attr_dev(button1, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button1, file, 71, 4, 2287);
    			add_location(li1, file, 70, 3, 2277);
    			attr_dev(path2, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path2, file, 88, 210, 4023);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "height", "16px");
    			attr_dev(svg2, "viewBox", "0 -960 960 960");
    			attr_dev(svg2, "width", "16px");
    			attr_dev(svg2, "fill", "#ffffff");
    			set_style(svg2, "transform", "rotate(" + (/*dropdowns*/ ctx[0].style ? '90deg' : '0deg') + ")");
    			set_style(svg2, "transition", "transform 0.3s ease");
    			add_location(svg2, file, 88, 5, 3818);
    			attr_dev(button2, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button2, file, 86, 4, 3648);
    			add_location(li2, file, 85, 3, 3638);
    			attr_dev(ul0, "class", "mt-8");
    			add_location(ul0, file, 52, 2, 964);
    			attr_dev(p0, "class", "text-left p-2 mt-8");
    			add_location(p0, file, 101, 2, 4738);
    			attr_dev(path3, "d", "m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z");
    			add_location(path3, file, 107, 208, 5196);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "height", "16px");
    			attr_dev(svg3, "viewBox", "0 -960 960 960");
    			attr_dev(svg3, "width", "16px");
    			attr_dev(svg3, "fill", "#ffffff");
    			set_style(svg3, "transform", "rotate(" + (/*dropdowns*/ ctx[0].cfg ? '90deg' : '0deg') + ")");
    			set_style(svg3, "transition", "transform 0.3s ease");
    			add_location(svg3, file, 107, 5, 4993);
    			attr_dev(button3, "class", "flex justify-between items-center w-full p-2 rounded transition ease-in-out hover:bg-dark-100");
    			add_location(button3, file, 105, 4, 4827);
    			add_location(li3, file, 104, 3, 4817);
    			add_location(ul1, file, 102, 2, 4791);
    			attr_dev(nav, "class", "w-1/5 h-screen bg-dark-200 text-white p-4 text-base border-r text-center");
    			add_location(nav, file, 50, 1, 798);
    			attr_dev(h11, "class", "text-3xl text-red-500 font-bold tracking-tight text-center mb-5");
    			add_location(h11, file, 120, 3, 5659);
    			attr_dev(p1, "class", "text-xs");
    			add_location(p1, file, 121, 3, 5763);
    			attr_dev(button4, "class", "px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-100");
    			add_location(button4, file, 119, 2, 5542);
    			attr_dev(main, "class", "flex flex-col items-center justify-center h-full w-full bg-black text-white font-body");
    			add_location(main, file, 117, 1, 5416);
    			attr_dev(div, "class", "flex h-screen w-screen");
    			add_location(div, file, 49, 0, 759);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, nav);
    			append_dev(nav, h10);
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
    			append_dev(main, button4);
    			append_dev(button4, h11);
    			append_dev(button4, t17);
    			append_dev(button4, p1);
    			append_dev(main, t19);
    			if (if_block4) if_block4.m(main, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_5*/ ctx[9], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_9*/ ctx[13], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_13*/ ctx[17], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dropdowns*/ 1) {
    				set_style(svg0, "transform", "rotate(" + (/*dropdowns*/ ctx[0].season ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[0].season) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(li0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*dropdowns*/ 1) {
    				set_style(svg1, "transform", "rotate(" + (/*dropdowns*/ ctx[0].holiday ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[0].holiday) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(li1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*dropdowns*/ 1) {
    				set_style(svg2, "transform", "rotate(" + (/*dropdowns*/ ctx[0].style ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[0].style) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					if_block2.m(li2, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*dropdowns*/ 1) {
    				set_style(svg3, "transform", "rotate(" + (/*dropdowns*/ ctx[0].cfg ? '90deg' : '0deg') + ")");
    			}

    			if (/*dropdowns*/ ctx[0].cfg) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					if_block3.m(li3, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
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

    function setTrue(map, key) {
    	if (map[key] == true) {
    		for (let k in map) {
    			map[k] = false;
    		}

    		return;
    	}

    	for (let k in map) {
    		map[k] = false;
    	}

    	map[key] = true;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let dropdowns = {
    		season: false,
    		holiday: false,
    		style: false,
    		cfg: false
    	};

    	function toggleDropdown(key) {
    		$$invalidate(0, dropdowns[key] = !dropdowns[key], dropdowns);
    	}

    	// All categories
    	let seasons = {
    		spring: false,
    		summer: false,
    		fall: false,
    		winter: false
    	};

    	let holiday = {
    		easter: false,
    		thanksgiving: false,
    		christmas: false
    	};

    	let style = { modern: false, old: false, trash: false };
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toggleDropdown('season');
    	const click_handler_1 = () => setTrue(seasons, 'spring');
    	const click_handler_2 = () => setTrue('season', 'summer');
    	const click_handler_3 = () => setTrue('season', 'fall');
    	const click_handler_4 = () => setTrue('season', 'winter');
    	const click_handler_5 = () => toggleDropdown('holiday');
    	const click_handler_6 = () => setTrue(holiday, 'easter');
    	const click_handler_7 = () => setTrue('holiday', 'thanksgiving');
    	const click_handler_8 = () => setTrue('holiday', 'christmas');
    	const click_handler_9 = () => toggleDropdown('style');
    	const click_handler_10 = () => setTrue('style', 'modern');
    	const click_handler_11 = () => setTrue('style', 'old');
    	const click_handler_12 = () => setTrue('style', 'trash');
    	const click_handler_13 = () => toggleDropdown('cfg');

    	$$self.$capture_state = () => ({
    		dropdowns,
    		toggleDropdown,
    		seasons,
    		holiday,
    		style,
    		setTrue
    	});

    	$$self.$inject_state = $$props => {
    		if ('dropdowns' in $$props) $$invalidate(0, dropdowns = $$props.dropdowns);
    		if ('seasons' in $$props) $$invalidate(2, seasons = $$props.seasons);
    		if ('holiday' in $$props) $$invalidate(3, holiday = $$props.holiday);
    		if ('style' in $$props) style = $$props.style;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		dropdowns,
    		toggleDropdown,
    		seasons,
    		holiday,
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
