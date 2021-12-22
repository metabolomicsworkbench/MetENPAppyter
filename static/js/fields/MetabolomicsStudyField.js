(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MetabolomicsStudyField = {}));
})(this, (function (exports) { 'use strict';

    function noop() { }
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
        node.parentNode.removeChild(node);
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
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
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
            ctx: null,
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

    /* js/StudySelectField.svelte generated by Svelte v3.44.2 */

    function create_fragment$2(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input = element("input");
    			attr(input, "type", "text");
    		},
    		m(target, anchor) {
    			insert(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen(input, "input", /*input_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(input);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { value } = $$props;

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	return [value, input_input_handler];
    }

    class StudySelectField extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 0 });
    	}
    }

    /* js/ChoiceField.svelte generated by Svelte v3.44.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (7:2) {#each choices as choice}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*choice*/ ctx[3] + "";
    	let t;
    	let option_value_value;

    	return {
    		c() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*choice*/ ctx[3];
    			option.value = option.__value;
    		},
    		m(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*choices*/ 2 && t_value !== (t_value = /*choice*/ ctx[3] + "")) set_data(t, t_value);

    			if (dirty & /*choices*/ 2 && option_value_value !== (option_value_value = /*choice*/ ctx[3])) {
    				option.__value = option_value_value;
    				option.value = option.__value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(option);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*choices*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (/*value*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[2].call(select));
    		},
    		m(target, anchor) {
    			insert(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen(select, "change", /*select_change_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*choices*/ 2) {
    				each_value = /*choices*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*value, choices*/ 3) {
    				select_option(select, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { choices = [] } = $$props;

    	function select_change_handler() {
    		value = select_value(this);
    		$$invalidate(0, value);
    		$$invalidate(1, choices);
    	}

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('choices' in $$props) $$invalidate(1, choices = $$props.choices);
    	};

    	return [value, choices, select_change_handler];
    }

    class ChoiceField extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { value: 0, choices: 1 });
    	}
    }

    /* js/MetabolomicsStudyField.svelte generated by Svelte v3.44.2 */

    function create_if_block_1(ctx) {
    	let sup;
    	let i;
    	let sup_title_value;

    	return {
    		c() {
    			sup = element("sup");
    			i = element("i");
    			attr(i, "class", "far fa-question-circle");
    			attr(sup, "data-toggle", "tooltip");
    			attr(sup, "title", sup_title_value = /*args*/ ctx[0].description);
    		},
    		m(target, anchor) {
    			insert(target, sup, anchor);
    			append(sup, i);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*args*/ 1 && sup_title_value !== (sup_title_value = /*args*/ ctx[0].description)) {
    				attr(sup, "title", sup_title_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(sup);
    		}
    	};
    }

    // (36:0) {:else}
    function create_else_block(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			a = element("a");
    			a.textContent = "Resolve Analysis and Factors";
    			attr(a, "href", "javascript:");
    			attr(a, "class", "btn btn-sm btn-primary");
    		},
    		m(target, anchor) {
    			insert(target, a, anchor);

    			if (!mounted) {
    				dispose = listen(a, "click", /*click_handler*/ ctx[9]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(a);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (31:0) {#if applicable_factors}
    function create_if_block(ctx) {
    	let t0;
    	let choicefield0;
    	let updating_value;
    	let br0;
    	let t1;
    	let choicefield1;
    	let updating_value_1;
    	let br1;
    	let t2;
    	let choicefield2;
    	let updating_value_2;
    	let br2;
    	let t3;
    	let choicefield3;
    	let updating_value_3;
    	let current;

    	function choicefield0_value_binding(value) {
    		/*choicefield0_value_binding*/ ctx[5](value);
    	}

    	let choicefield0_props = { choices: /*applicable_analysis*/ ctx[2] };

    	if (/*args*/ ctx[0].value.anal !== void 0) {
    		choicefield0_props.value = /*args*/ ctx[0].value.anal;
    	}

    	choicefield0 = new ChoiceField({ props: choicefield0_props });
    	binding_callbacks.push(() => bind(choicefield0, 'value', choicefield0_value_binding));

    	function choicefield1_value_binding(value) {
    		/*choicefield1_value_binding*/ ctx[6](value);
    	}

    	let choicefield1_props = {
    		choices: /*applicable_fac_colnames*/ ctx[3]
    	};

    	if (/*args*/ ctx[0].value.faccol !== void 0) {
    		choicefield1_props.value = /*args*/ ctx[0].value.faccol;
    	}

    	choicefield1 = new ChoiceField({ props: choicefield1_props });
    	binding_callbacks.push(() => bind(choicefield1, 'value', choicefield1_value_binding));

    	function choicefield2_value_binding(value) {
    		/*choicefield2_value_binding*/ ctx[7](value);
    	}

    	let choicefield2_props = { choices: /*applicable_factors*/ ctx[1] };

    	if (/*args*/ ctx[0].value.fac1 !== void 0) {
    		choicefield2_props.value = /*args*/ ctx[0].value.fac1;
    	}

    	choicefield2 = new ChoiceField({ props: choicefield2_props });
    	binding_callbacks.push(() => bind(choicefield2, 'value', choicefield2_value_binding));

    	function choicefield3_value_binding(value) {
    		/*choicefield3_value_binding*/ ctx[8](value);
    	}

    	let choicefield3_props = { choices: /*applicable_factors*/ ctx[1] };

    	if (/*args*/ ctx[0].value.fac2 !== void 0) {
    		choicefield3_props.value = /*args*/ ctx[0].value.fac2;
    	}

    	choicefield3 = new ChoiceField({ props: choicefield3_props });
    	binding_callbacks.push(() => bind(choicefield3, 'value', choicefield3_value_binding));

    	return {
    		c() {
    			t0 = text("Analysis: ");
    			create_component(choicefield0.$$.fragment);
    			br0 = element("br");
    			t1 = text("\nFactor Column Name: ");
    			create_component(choicefield1.$$.fragment);
    			br1 = element("br");
    			t2 = text("\nFactor 1: ");
    			create_component(choicefield2.$$.fragment);
    			br2 = element("br");
    			t3 = text("\nFactor 2: ");
    			create_component(choicefield3.$$.fragment);
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			mount_component(choicefield0, target, anchor);
    			insert(target, br0, anchor);
    			insert(target, t1, anchor);
    			mount_component(choicefield1, target, anchor);
    			insert(target, br1, anchor);
    			insert(target, t2, anchor);
    			mount_component(choicefield2, target, anchor);
    			insert(target, br2, anchor);
    			insert(target, t3, anchor);
    			mount_component(choicefield3, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const choicefield0_changes = {};
    			if (dirty & /*applicable_analysis*/ 4) choicefield0_changes.choices = /*applicable_analysis*/ ctx[2];

    			if (!updating_value && dirty & /*args*/ 1) {
    				updating_value = true;
    				choicefield0_changes.value = /*args*/ ctx[0].value.anal;
    				add_flush_callback(() => updating_value = false);
    			}

    			choicefield0.$set(choicefield0_changes);
    			const choicefield1_changes = {};
    			if (dirty & /*applicable_fac_colnames*/ 8) choicefield1_changes.choices = /*applicable_fac_colnames*/ ctx[3];

    			if (!updating_value_1 && dirty & /*args*/ 1) {
    				updating_value_1 = true;
    				choicefield1_changes.value = /*args*/ ctx[0].value.faccol;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			choicefield1.$set(choicefield1_changes);
    			const choicefield2_changes = {};
    			if (dirty & /*applicable_factors*/ 2) choicefield2_changes.choices = /*applicable_factors*/ ctx[1];

    			if (!updating_value_2 && dirty & /*args*/ 1) {
    				updating_value_2 = true;
    				choicefield2_changes.value = /*args*/ ctx[0].value.fac1;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			choicefield2.$set(choicefield2_changes);
    			const choicefield3_changes = {};
    			if (dirty & /*applicable_factors*/ 2) choicefield3_changes.choices = /*applicable_factors*/ ctx[1];

    			if (!updating_value_3 && dirty & /*args*/ 1) {
    				updating_value_3 = true;
    				choicefield3_changes.value = /*args*/ ctx[0].value.fac2;
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			choicefield3.$set(choicefield3_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(choicefield0.$$.fragment, local);
    			transition_in(choicefield1.$$.fragment, local);
    			transition_in(choicefield2.$$.fragment, local);
    			transition_in(choicefield3.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(choicefield0.$$.fragment, local);
    			transition_out(choicefield1.$$.fragment, local);
    			transition_out(choicefield2.$$.fragment, local);
    			transition_out(choicefield3.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(t0);
    			destroy_component(choicefield0, detaching);
    			if (detaching) detach(br0);
    			if (detaching) detach(t1);
    			destroy_component(choicefield1, detaching);
    			if (detaching) detach(br1);
    			if (detaching) detach(t2);
    			destroy_component(choicefield2, detaching);
    			if (detaching) detach(br2);
    			if (detaching) detach(t3);
    			destroy_component(choicefield3, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*args*/ ctx[0].label + "";
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let studyselectfield;
    	let updating_value;
    	let t4;
    	let br0;
    	let t5;
    	let current_block_type_index;
    	let if_block1;
    	let t6;
    	let br1;
    	let t7;
    	let textarea;
    	let textarea_name_value;
    	let textarea_value_value;
    	let current;
    	let if_block0 = /*args*/ ctx[0].description && create_if_block_1(ctx);

    	function studyselectfield_value_binding(value) {
    		/*studyselectfield_value_binding*/ ctx[4](value);
    	}

    	let studyselectfield_props = {};

    	if (/*args*/ ctx[0].value.study_id !== void 0) {
    		studyselectfield_props.value = /*args*/ ctx[0].value.study_id;
    	}

    	studyselectfield = new StudySelectField({ props: studyselectfield_props });
    	binding_callbacks.push(() => bind(studyselectfield, 'value', studyselectfield_value_binding));
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*applicable_factors*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			if (if_block0) if_block0.c();
    			t1 = text(":");
    			t2 = space();
    			div1 = element("div");
    			t3 = text("Study ID: ");
    			create_component(studyselectfield.$$.fragment);
    			t4 = space();
    			br0 = element("br");
    			t5 = space();
    			if_block1.c();
    			t6 = space();
    			br1 = element("br");
    			t7 = space();
    			textarea = element("textarea");
    			attr(div0, "class", "col-lg-3 bold text-lg-right my-auto");
    			attr(div1, "class", "col-lg-6 pt-2 pt-lg-0");
    			attr(div2, "class", "row px-4 px-lg-3 pb-4");
    			textarea.readOnly = true;
    			attr(textarea, "name", textarea_name_value = /*args*/ ctx[0].name);
    			attr(textarea, "type", "text");
    			set_style(textarea, "display", "none");
    			textarea.value = textarea_value_value = JSON.stringify(/*args*/ ctx[0].value);
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div0, t0);
    			if (if_block0) if_block0.m(div0, null);
    			append(div0, t1);
    			append(div2, t2);
    			append(div2, div1);
    			append(div1, t3);
    			mount_component(studyselectfield, div1, null);
    			append(div1, t4);
    			append(div1, br0);
    			append(div1, t5);
    			if_blocks[current_block_type_index].m(div1, null);
    			append(div1, t6);
    			append(div1, br1);
    			insert(target, t7, anchor);
    			insert(target, textarea, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if ((!current || dirty & /*args*/ 1) && t0_value !== (t0_value = /*args*/ ctx[0].label + "")) set_data(t0, t0_value);

    			if (/*args*/ ctx[0].description) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div0, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const studyselectfield_changes = {};

    			if (!updating_value && dirty & /*args*/ 1) {
    				updating_value = true;
    				studyselectfield_changes.value = /*args*/ ctx[0].value.study_id;
    				add_flush_callback(() => updating_value = false);
    			}

    			studyselectfield.$set(studyselectfield_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div1, t6);
    			}

    			if (!current || dirty & /*args*/ 1 && textarea_name_value !== (textarea_name_value = /*args*/ ctx[0].name)) {
    				attr(textarea, "name", textarea_name_value);
    			}

    			if (!current || dirty & /*args*/ 1 && textarea_value_value !== (textarea_value_value = JSON.stringify(/*args*/ ctx[0].value))) {
    				textarea.value = textarea_value_value;
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(studyselectfield.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(studyselectfield.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (if_block0) if_block0.d();
    			destroy_component(studyselectfield);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach(t7);
    			if (detaching) detach(textarea);
    		}
    	};
    }

    function ensureListOfStudies(data) {
    	if ('study_id' in data) {
    		return [data];
    	} else {
    		return Object.values(data);
    	}
    }

    function instance($$self, $$props, $$invalidate) {
    	let { args } = $$props;
    	console.log(args.value);
    	let applicable_factors;
    	let applicable_analysis;
    	let applicable_fac_colnames;

    	function studyselectfield_value_binding(value) {
    		if ($$self.$$.not_equal(args.value.study_id, value)) {
    			args.value.study_id = value;
    			$$invalidate(0, args);
    		}
    	}

    	function choicefield0_value_binding(value) {
    		if ($$self.$$.not_equal(args.value.anal, value)) {
    			args.value.anal = value;
    			$$invalidate(0, args);
    		}
    	}

    	function choicefield1_value_binding(value) {
    		if ($$self.$$.not_equal(args.value.faccol, value)) {
    			args.value.faccol = value;
    			$$invalidate(0, args);
    		}
    	}

    	function choicefield2_value_binding(value) {
    		if ($$self.$$.not_equal(args.value.fac1, value)) {
    			args.value.fac1 = value;
    			$$invalidate(0, args);
    		}
    	}

    	function choicefield3_value_binding(value) {
    		if ($$self.$$.not_equal(args.value.fac2, value)) {
    			args.value.fac2 = value;
    			$$invalidate(0, args);
    		}
    	}

    	const click_handler = async () => {
    		// TODO: resolve applicable  analysis and factors
    		const analysis_url = 'https://www.metabolomicsworkbench.org/rest/study/study_id/' + args.value.study_id + '/analysis/';

    		const res_anal = await fetch(analysis_url);
    		const data_anal = await res_anal.json();
    		const study_anal = new Set();

    		//Object.values(data_anal).forEach(({ analysis_summary }) => study_anal.add(analysis_summary));
    		ensureListOfStudies(data_anal).forEach(({ analysis_summary }) => study_anal.add(analysis_summary));

    		// 12/20/2021: add the combined analysis string as another element
    		// use ___ as a separator for multiple analysis types; also in the ipynb file for the appyter (not anywhere else)
    		const analysis_type_sep = "___";

    		//const combined_str = "All analysis together";
    		//const combined_str = "Core G Fatty acids/Eicosanoids___Core J Sterols___Core K Prenols/Cardiolipins___Core E Neutral Lipids___Core I Sphingolipids___Core H Phospholipids";
    		// https://stackoverflow.com/questions/47243139/how-to-convert-set-to-string-with-space
    		const combined_str = Array.from(study_anal).join(analysis_type_sep);

    		study_anal.add(combined_str);
    		$$invalidate(2, applicable_analysis = [...study_anal]);
    		const factors_url = 'https://www.metabolomicsworkbench.org/rest/study/study_id/' + args.value.study_id + '/factors/';
    		const res = await fetch(factors_url);
    		const data = await res.json();
    		const study_factors = new Set();
    		const study_fac_colnames = new Set();

    		// in python: factors_unq = list(np.unique(np.array(factors_df['factors'].tolist())))
    		// factors in { } refers to the factors field in the json object, which is, data
    		// explanation: [{hello: "hi"}, {hello: "Mano"}].map(({hello}) => hello) == ["hi", "Mano"]
    		// explanation: data.forEach((datum) => factors.add(datum.factors))
    		// {(console.log(data), '')}
    		Object.values(data).forEach(({ factors }) => study_factors.add(factors.split(":")[1]));

    		Object.values(data).forEach(({ factors }) => study_fac_colnames.add(factors.split(":")[0]));
    		$$invalidate(1, applicable_factors = [...study_factors]);
    		$$invalidate(3, applicable_fac_colnames = [...study_fac_colnames]);
    	};

    	$$self.$$set = $$props => {
    		if ('args' in $$props) $$invalidate(0, args = $$props.args);
    	};

    	return [
    		args,
    		applicable_factors,
    		applicable_analysis,
    		applicable_fac_colnames,
    		studyselectfield_value_binding,
    		choicefield0_value_binding,
    		choicefield1_value_binding,
    		choicefield2_value_binding,
    		choicefield3_value_binding,
    		click_handler
    	];
    }

    class MetabolomicsStudyField extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { args: 0 });
    	}
    }

    exports.MetabolomicsStudyField = MetabolomicsStudyField;
    exports["default"] = MetabolomicsStudyField;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
