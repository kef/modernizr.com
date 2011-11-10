/**
 * Modulizr
 * Modernizr Modular Build Tool
 * Very simple tool for including or excluding tests
 * 
 * @Author  Alex Sexton - AlexSexton@gmail.com
 * @License Dual MIT and WTFPL
 */

/**
 * This section does the conditional build
 */
(function(global){
  var Modulizr = {
    _dependencies: {
      'canvastext'      : ['canvas'],
      'csstransforms3d' : ['prefixes', 'testprop', 'testbundle', 'teststyles'],
      'flexbox'         : ['prefixes'],
      'cssgradients'    : ['prefixes'],
      'opacity'         : ['prefixes'],
      'indexedDB'       : ['domprefixes'],
      'backgroundsize'  : ['domprefixes', 'testprop', 'testallprops'],
      'borderimage'     : ['domprefixes', 'testprop', 'testallprops'],
      'borderradius'    : ['domprefixes', 'testprop', 'testallprops'],
      'boxshadow'       : ['domprefixes', 'testprop', 'testallprops'],
      'cssanimations'   : ['domprefixes', 'testprop', 'testallprops'],
      'csscolumns'      : ['domprefixes', 'testprop', 'testallprops'],
      'cssreflections'  : ['domprefixes', 'testprop', 'testallprops'],
      'csstransitions'  : ['domprefixes', 'testprop', 'testallprops'],
      'testallprops'    : ['domprefixes', 'testprop'],
      'prefixed'        : ['domprefixes', 'testprop', 'testallprops'],
      'csstransforms'   : ['testprop'],
      'mq'              : ['teststyles'],
      'hashchange'      : ['hasevent'],
      'draganddrop'     : ['hasevent'],
      'generatedcontent': ['smile', 'testbundle', 'teststyles'],
      'svg'             : ['ns'],
      'inlinesvg'       : ['ns'],
      'smil'            : ['ns'],
      'svgclippaths'    : ['ns'],
      'input'           : ['webforms', 'inputelem'],
      'inputtypes'      : ['webforms', 'inputelem', 'smile'],
      'touch'           : ['prefixes', 'testbundle', 'teststyles'],
      'fontface'        : ['testbundle', 'teststyles'],
      'testbundle'      : ['teststyles'],
      'respond'         : ['mq', 'teststyles'],
      'websockets'      : ['domprefixes'],
      // community
      'cookies'                        : ['addtest'],
      'css_backgroundrepeat'           : ['addtest'],
      'css_backgroundsizecover'        : ['addtest'],
      'css_boxsizing'                  : ['addtest'],
      'css_cubicbezierrange'           : ['addtest'],
      'css_displaytable'               : ['addtest'],
      'css_overflow_scrolling'         : ['addtest'],
      'css_pointerevents'              : ['addtest'],
      'css_userselect'                 : ['addtest'],
      'custom_protocol_handler'        : ['addtest'],
      'dom_createElement_attrs'        : ['addtest'],
      'elem_details'                   : ['addtest'],
      'elem_progress_meter'            : ['addtest'],
      'emoji'                          : ['addtest', 'canvas'],
      'event_deviceorientation_motion' : ['addtest'],
      'file_api'                       : ['addtest'],
      'forms_placeholder'              : ['addtest'],
      'hyphens'                        : ['addtest'],
      'img_webp'                       : ['addtest'],
      'url_data_uri'                   : ['addtest'],
      'webgl_extensions'               : ['addtest'],
      'window_framed'                  : ['addtest'],
      'workers_sharedworkers'          : ['addtest']
    },
    /**
     * Function ize
     *
     * @argument source  {string} The marked up original source
     * @argument tests   {array}  An array of strings that match test string identifiers in the source
     *
     * @returns {string} The new source with only the requested modules
     */
    ize: function(source, tests, autoCB){
      // Variables for string manipulation and saving
      var js_notests,
          js_noret,
          js_nostr,
          parsed,
          i, j, k, l, z,
          strings = [],
          retStack = [],
          testStack = [],
          sid = '_' + ( + new Date()),
          multilinespaceExp = new RegExp(/\s{4}\n/g);
      
      this.wantedHash = (function(){
        var hash = {}, k;
        for(k = 0; k < tests.length; k++) {
          hash[tests[k]] = true;
        }
        return hash;
      })();

      // Add in the dependencies of the things we want
      for (k in this._dependencies) {
        if (this._dependencies.hasOwnProperty(k)) {
          // If we want this dependency
          if (this.wantedHash[k]) {
            // go through each dependency of this
            for (z = 0; z < this._dependencies[k].length; z++) {
              // Add to tests array
              tests.push(this._dependencies[k][z]);
              // Let the calling app know what we automatically added back in.
              autoCB && autoCB( this._dependencies[k][z] );
              // Add to the hashed version
              this.wantedHash[this._dependencies[k][z]] = true;
            }
          }
        }
      }

      // Handle the out of the ordinary stuff first
      source = this._handleSpecialCases(source, tests);

      // Remove comments so we don't have false parsing positives
      source = this._removeComments(source);

      // Mark the tests
      js_notests = source.replace(/tests\['(.*)'\]/g, function($0, $1) {
        testStack[testStack.length] = {"code":$0, "name": $1};
        return 'TEST__'+$1+'__';
      });

      js_noret = js_notests.replace(/ret\['(.*)'\]/g, function($0, $1) {
        retStack[retStack.length] = {"code":$0, "name":$1};
        return 'TRET__'+$1+'__';
      });

      // remove string literals
      js_nostr = js_noret.replace(/("|')((?:\\\1|.)+?)\1/g, function($0) {
      	strings[strings.length] = $0;
      	return 'STR__'+(strings.length-1)+'__';
      });

      // actually take out the code, etc
      parsed = this._pullOutTests(js_nostr, tests);
      
      for (j = 0; j < strings.length; j++) {
        // put the strings back where they belong!
        parsed = parsed.replace(RegExp("STR__"+j+"__", 'g'), function() {
          return strings[j];
        });
      }

      for (l = 0; l < retStack.length; l++) {
        // put the strings back where they belong!
        parsed = parsed.replace(RegExp("TRET__"+retStack[l].name+"__", 'g'), function($0) {
          return retStack[l].code;
        });
      }

      // put the test array declarations back where they go
      for (i = 0; i < testStack.length; i++) {
        parsed = parsed.replace(RegExp("TEST__"+testStack[i].name+"__", 'g'), function($0) {
          return testStack[i].code;
        });
      }

      // Strip out the 4space-newline stuff that's left over, just for fun.
      while (multilinespaceExp.test(parsed)) {
        parsed = parsed.replace(multilinespaceExp, "");
      }

      // return the altered version
      return parsed;
    
    },

    _handleSpecialCases: function(source, wanted) {
      var normalRemoval = function( source, key ) {
        source = source.replace(new RegExp("\\/\\*>>"+key+"\\*\\/[\\s|\\S]*?\\/\\*>>"+key+"\\*\\/", "ig"), "");
        return source;
      },

      // Functions to run if they are NOT wanted
      specialCases = {
        // This function removes the IE print protector
        iepp : function(source) {
          return normalRemoval( source, 'iepp' );
        },
        mq : function(source) {
          return normalRemoval( source, 'mq' );
        },
        cssclasses : function(source) {
          return normalRemoval( source, 'cssclasses' );
        },
        addtest : function(source) {
          return normalRemoval( source, 'addtest' );
        },
        prefixed : function(source) {
          return normalRemoval( source, 'prefixed' );
        },
        teststyles : function(source) {
          return normalRemoval( source, 'teststyles' );
        },
        testprop : function(source) {
          return normalRemoval( source, 'testprop' );
        },
        testallprops : function(source) {
          return normalRemoval( source, 'testallprops' );
        },
        hasevent : function(source) {
          return normalRemoval( source, 'hasevent' );
        },
        prefixes : function(source) {
          return normalRemoval( source, 'prefixes' );
        },
        domprefixes : function(source) {
          return normalRemoval( source, 'domprefixes' );
        },
        input : function(source) {
          return normalRemoval( source, 'input' );
        },
        inputtypes : function(source) {
          return normalRemoval( source, 'inputtypes' );
        },
        ns : function(source) {
          return normalRemoval( source, 'ns' );
        },
        smile : function(source) {
          return normalRemoval( source, 'smile' );
        },
        inputelem : function(source) {
          return normalRemoval( source, 'inputelem' );
        },
        webforms : function(source) {
          return normalRemoval( source, 'webforms' );
        },
        touch : function(source) {
          return normalRemoval( source, 'touch' );
        },
        csstransforms3d : function(source) {
          return normalRemoval( source, 'csstransforms3d' );
        },
        generatedcontent : function(source) {
          return normalRemoval( source, 'generatedcontent' );
        },
        fontface : function(source) {
          return normalRemoval( source, 'fontface' );
        },
        testbundle : function(source) {
          return normalRemoval( source, 'testbundle' );
        }
      },
      // Speedier lookups
      wantedHash = this.wantedHash;
     
      for (var name in specialCases) {
        if (specialCases.hasOwnProperty(name)) {
          // If we DONT want any of the special cases, run them
          if (!wantedHash[name]) {
            source = specialCases[name](source);
          }
        }
      }
      return source;
    },

    _pullOutTests: function(source, wanted) {
      var sub, i, j, start, end, name, 
      sub2, bracketStack, tests = {}, 
      tmpStart, tmpEnd,
      spaceOffset = 0;

      // Step through the source
      for (i = 0; i < source.length; i++) {
        sub = source.substr(i, 6);
        // If we find a test identifier
        if (sub === "TEST__" || sub === "TRET__") {
          // Save the beginning here
          start = i;

          // counts along the name
          j = 0;

          // Grab it's name
          while (source.substr(i+j+6,2) !== '__') {
            j++;
          }

          // Save the name
          name = source.substr(i+6, j).toLowerCase();
          
          // update counter
          i = i + j;

          // Look for a function definition next
          while (source.substr(i, 8) !== 'function') {
            i++;
          }

          // Skip past the function def
          i += 8;
          
          // Look for the opening '{' character
          while (source.charAt(i) !== '{') {
            i++;
          }

          // Set the initial count
          bracketStack = 1;
          i++;

          // Find an even amount of {} pairs
          while(bracketStack) {
            sub2 = source.charAt(i);
            if (sub2 === '{') {
              bracketStack++;
            }
            else if (sub2 === '}') {
              bracketStack--;
            }
            i++;
          }

          // Watch out for IFFEs
          if (source.substr(i,2) === ")(") {
            i += 2;
            parenStack = 1;
            while (parenStack) {
              if (source.charAt(i) === ')') {
                parenStack--;
              }
              else if (source.charAt(i) === '(') {
                parenStack++;
              }
              i++;
            }
          }

          // Add the semicolon
          end = i+1;
          
          // Add this to the tests hash
          tests[name] = {
            "start": start,
            "end": end
          };
        }
      }
      
      // Turn our wanted array into a hash, for speeedz
      var wantedHash = this.wantedHash; 

      // go through the tests that we know about, and remove the ones we don't want
      for (var test in tests) {
        if (tests.hasOwnProperty(test)) {
          // If it's not one that we want
          if (!wantedHash[test]) {
            tmpStart = tests[test].start;
            tmpEnd   = tests[test].end;
            // Take it out
            source = source.substr(0, tmpStart - spaceOffset) + source.substr(tmpEnd - spaceOffset);
            spaceOffset += tmpEnd - tmpStart;
          }
        }
      }
      return source;
    },

    /*
    * Stolen from james padolsey at
    * http://james.padolsey.com/javascript/removing-comments-in-javascript/
    * - This function is loosely based on the one found here:
    * - http://www.weanswer.it/blog/optimize-css-javascript-remove-comments-php/
    */
    _removeComments:  function(str) {
      str = ('__' + str + '__').split('');
      var mode = {
          singleQuote: false,
          doubleQuote: false,
          regex: false,
          blockComment: false,
          lineComment: false,
          condComp: false 
      };
      for (var i = 0, l = str.length; i < l; i++) {
 
        if (mode.regex) {
          if (str[i] === '/' && str[i-1] !== '\\') {
            mode.regex = false;
          }
          continue;
        }
 
        if (mode.singleQuote) {
          if (str[i] === "'" && str[i-1] !== '\\') {
             mode.singleQuote = false;
          }
          continue;
        }
 
        if (mode.doubleQuote) {
          if (str[i] === '"' && str[i-1] !== '\\') {
            mode.doubleQuote = false;
          }
          continue;
        }
 
        if (mode.blockComment) {
          if (str[i] === '*' && str[i+1] === '/') {
            str[i+1] = '';
            mode.blockComment = false;
          }
          str[i] = '';
          continue;
        }
 
        if (mode.lineComment) {
          if (str[i+1] === '\n' || str[i+1] === '\r') {
            mode.lineComment = false;
          }
          str[i] = '';
          continue;
        }
 
        if (mode.condComp) {
          if (str[i-2] === '@' && str[i-1] === '*' && str[i] === '/') {
            mode.condComp = false;
          }
          continue;
        }
 
        mode.doubleQuote = str[i] === '"';
        mode.singleQuote = str[i] === "'";
 
        if (str[i] === '/') {
 
          if (str[i+1] === '*' && str[i+2] === '@') {
            mode.condComp = true;
            continue;
          }
          if (str[i+1] === '*') {
            str[i] = '';
            mode.blockComment = true;
            continue;
          }
          if (str[i+1] === '/') {
            str[i] = '';
            mode.lineComment = true;
            continue;
          }
          mode.regex = true;
 
        }
 
      }
      return str.join('').slice(2, -2);
    },
    
    
    // IndexOf Function Stolen from UnderscoreJS, but pretty common, soo....
    _indexOf: function(array, item) {
      var ArrayProto = Array.prototype;
      if (ArrayProto.indexOf && array.indexOf === ArrayProto.indexOf) return array.indexOf(item);
      for (var i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
      return -1;
    }
  };
  
  // Leak Me
  global.Modulizr = Modulizr;
})(this);
