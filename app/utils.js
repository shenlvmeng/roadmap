// 摘录自underscore.js的_.template函数
// https://github.com/hanzichi/underscore-analysis/blob/16821aafbdd975e93cf28f25d940ca64454ee437/underscore-1.8.3.js/underscore-1.8.3-analysis.js#L2766
const templateSettings = {
  // 三种渲染模板
  evaluate    : /<%([\s\S]+?)%>/g,
  interpolate : /<%=([\s\S]+?)%>/g,
  escape      : /<%-([\s\S]+?)%>/g
};
const noMatch = /(.)^/;
// RegExp pattern
const escaper = /\\|'|\r|\n|\u2028|\u2029/g;
const escapes = {
  "'":      "'",
  '\\':     '\\',
  '\r':     'r',  // 回车符
  '\n':     'n',  // 换行符
  // http://stackoverflow.com/questions/16686687/json-stringify-and-u2028-u2029-check
  '\u2028': 'u2028', // Line separator
  '\u2029': 'u2029'  // Paragraph separator
};
const escapeChar = function(match) {
  /**
    '      => \\'
    \\     => \\\\
    \r     => \\r
    \n     => \\n
    \u2028 => \\u2028
    \u2029 => \\u2029
  **/
  return '\\' + escapes[match];
};
// 将 JavaScript 模板编译为可以用于页面呈现的函数
// JavaScript micro-templating, similar to John Resig's implementation.
// Underscore templating handles arbitrary delimiters, preserves whitespace,
// and correctly escapes quotes within interpolated code.
// NB: `oldSettings` only exists for backwards compatibility.
// oldSettings 参数为了兼容 underscore 旧版本
// setting 参数可以用来自定义字符串模板（但是 key 要和 _.templateSettings 中的相同，才能 overridden）
// 1. <%  %> - to execute some code
// 2. <%= %> - to print some value in template
// 3. <%- %> - to print some values HTML escaped
// Compiles JavaScript templates into functions
// _.template(templateString, [settings])
function template(text, settings) {
  // 相同的 key，优先选择 settings 对象中的
  // 其次选择 _.templateSettings 对象中的
  // 生成最终用来做模板渲染的字符串
  // 自定义模板优先于默认模板 _.templateSettings
  // 如果定义了相同的 key，则前者会覆盖后者
  settings = Object.assign({}, settings, templateSettings);

  // Combine delimiters into one regular expression via alternation.
  // 正则表达式 pattern，用于正则匹配 text 字符串中的模板字符串
  // /<%-([\s\S]+?)%>|<%=([\s\S]+?)%>|<%([\s\S]+?)%>|$/g
  // 注意最后还有个 |$
  var matcher = RegExp([
    // 注意下 pattern 的 source 属性
    (settings.escape || noMatch).source,
    (settings.interpolate || noMatch).source,
    (settings.evaluate || noMatch).source
  ].join('|') + '|$', 'g');

  // Compile the template source, escaping string literals appropriately.
  // 编译模板字符串，将原始的模板字符串替换成函数字符串
  // 用拼接成的函数字符串生成函数（new Function(...)）
  var index = 0;

  // source 变量拼接的字符串用来生成函数
  // 用于当做 new Function 生成函数时的函数字符串变量
  // 记录编译成的函数字符串，可通过 _.template(tpl).source 获取（_.template(tpl) 返回方法）
  var source = "__p+='";

  // replace 函数不需要为返回值赋值，主要是为了在函数内对 source 变量赋值
  // 将 text 变量中的模板提取出来
  // match 为匹配的整个串
  // escape/interpolate/evaluate 为匹配的子表达式（如果没有匹配成功则为 undefined）
  // offset 为字符匹配（match）的起始位置（偏移量）
  text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
    // \n => \\n
    source += text.slice(index, offset).replace(escaper, escapeChar);

    // 改变 index 值，为了下次的 slice
    index = offset + match.length;

    if (escape) {
      // 需要对变量进行编码（=> HTML 实体编码）
      // 避免 XSS 攻击
      source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
    } else if (interpolate) {
      // 单纯的插入变量
      source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
    } else if (evaluate) {
      // 可以直接执行的 JavaScript 语句
      // 注意 "__p+="，__p 为渲染返回的字符串
      source += "';\n" + evaluate + "\n__p+='";
    }

    // Adobe VMs need the match returned to produce the correct offset.
    // return 的作用是？
    // 将匹配到的内容原样返回（Adobe VMs 需要返回 match 来使得 offset 值正常）
    return match;
  });

  source += "';\n";

  // By default, `template` places the values from your data in the local scope via the `with` statement.
  // However, you can specify a single variable name with the variable setting.
  // This can significantly improve the speed at which a template is able to render.
  // If a variable is not specified, place data values in local scope.
  // 指定 scope
  // 如果设置了 settings.variable，能显著提升模板的渲染速度
  // 否则，默认用 with 语句指定作用域
  if (!settings.variable)
    source = 'with(obj||{}){\n' + source + '}\n';

  // 增加 print 功能
  // __p 为返回的字符串
  source = "var __t,__p='',__j=Array.prototype.join," +
    "print=function(){__p+=__j.call(arguments,'');};\n" +
    source + 'return __p;\n';

  try {
    // render 方法，前两个参数为 render 方法的参数
    // obj 为传入的 JSON 对象，传入 _ 参数使得函数内部能用 Underscore 的函数
    var render = new Function(settings.variable || 'obj', '_', source);
  } catch (e) {
    // 抛出错误
    e.source = source;
    throw e;
  }

  // 返回的函数
  // data 一般是 JSON 数据，用来渲染模板
  var template = function(data) {
    // render 为模板渲染函数
    // 传入参数 _ ，使得模板里 <%  %> 里的代码能用 underscore 的方法
    //（<%  %> - to execute some code）
    return render.call(this, data);
  };

  // Provide the compiled source as a convenience for precompilation.
  // template.source for debug?
  // obj 与 with(obj||{}) 中的 obj 对应
  var argument = settings.variable || 'obj';

  // 可通过 _.template(tpl).source 获取
  // 可以用来预编译，在服务端预编译好，直接在客户端生成代码，客户端直接调用方法
  // 这样如果出错就能打印出错行
  // Precompiling your templates can be a big help when debugging errors you can't reproduce.
  // This is because precompiled templates can provide line numbers and a stack trace,
  // something that is not possible when compiling templates on the client.
  // The source property is available on the compiled template function for easy precompilation.
  // see @http://stackoverflow.com/questions/18755292/underscore-js-precompiled-templates-using
  // see @http://stackoverflow.com/questions/13536262/what-is-javascript-template-precompiling
  // see @http://stackoverflow.com/questions/40126223/can-anyone-explain-underscores-precompilation-in-template
  // JST is a server-side thing, not client-side.
  // This mean that you compile Unserscore template on server side by some server-side script and save the result in a file.
  // Then use this file as compiled Unserscore template.
  template.source = 'function(' + argument + '){\n' + source + '}';

  return template;
};

module.exports = {
  tmpl: template
}