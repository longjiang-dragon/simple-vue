/**
 * 主要实现三个功能点：
 * 1、将dom节点番移入到DocumentFragment中（在虚拟dom中操作不会引起浏览器的重绘，性能会比直接操作dom好一些）
 * 2、递归调用compileElement函数来遍历所有子节点，如果子节点包含{{}}形式的则调用compileText
 * 3、compileText函数创建新的watcher。
 *
 */

/**
 *
 * @param el  id 为该值的节点   '#app'
 * @param vm
 * @constructor
 */
function Compile(el, vm) {
  this.vm = vm
  //查找到节点  <div id="app">
  this.el = document.querySelector(el)
  this.fragment = null
  this.init()
}
Compile.prototype = {
  init: function() {
    if(this.el) {
      //得到一个新的document对象,其中包含了现在的
      this.fragment = this.nodeToFragement(this.el)
      this.compileElement(this.fragment)
      this.el.appendChild(this.fragment)
    } else {
      console.warn('绑定元素不存在')
    }
  },
  nodeToFragement: function(el) {
    //创建一个新的document
    var fragment = document.createDocumentFragment()
    var child = el.firstChild
    // 将dom节点移到fragment
    while(child) {
      //appendchild：如果当前节点已经在当前文档树中，那么appendChild只会将从原生的位置移动到新位置（也不需要事先移除需要移动的点）
      fragment.appendChild(child)
      child = el.firstChild
    }
    console.log("老document后的老 dom树====" ,el)
    console.log("新document后的老 dom树====",fragment.children)
    return fragment
  },
  /**
   *
   * @param fragment  新创建的document
   */
  compileElement: function(fragment) {
    var childNodes = fragment.childNodes;
    var self = this;
    console.log("childNodes====",childNodes);
    // todo   [].slice.call(childNodes) childNodes是一个类数组，想要遍历的话，需要转换成数组
    [].slice.call(childNodes).forEach(function(node) {
      var reg = /\{\{(.*)\}\}/
      var text = node.textContent
      if (self.isElementNode(node)) {
        self.compile(node);
      } else if (self.isTextNode(node) && reg.test(text)) {
        self.compileText(node, reg.exec(text)[1])
      }
      if (node.childNodes && node.childNodes.length) {
        self.compileElement(node)  // 递归遍历子节点
      }
    });
  },
  compile: function(node) {
    var nodeAttrs = node.attributes;
    var self = this;
    Array.prototype.forEach.call(nodeAttrs, function(attr) {
      var attrName = attr.name;
      if (self.isEvenDirective(attrName)) {  // 属性名以v-on:开头
        var functionName = attr.value;
        self.compileEvent(node, self.vm, functionName, attrName);
        //移除绑定属性用的代码，建立绑定关系后，就没有必要存在了。
        node.removeAttribute(attrName);
      }
    })
  },
  /**
   *建立xml中所引用的变量与data中变量的绑定关系
   * @param node  变量的值
   * @param exp 变量名
   */
  compileText: function(node, exp) {

    var self = this
    var initText = this.vm[exp]
    this.updateText(node, initText)
    new Watcher(this.vm, exp, function(value) {
      self.updateText(node, value)
    })
  },
  /**
   *
   * @param node 当前节点
   * @param vm 运行环境
   * @param functionName  事件触发回调时调用的方法
   * @param attrName  属性名
   */
  compileEvent: function(node, vm, functionName, attrName) {
    //事件类型
    var eventType = attrName.split(':')[1];
    var cb = vm.methods && vm.methods[functionName];

    if (eventType && cb) {
      node.addEventListener(eventType, cb.bind(vm), false);
    }
  },
  isTextNode: function(node) {
    return node.nodeType == 3
  },
  isElementNode: function(node) {
    return node.nodeType == 1
  },
  isEvenDirective: function(attrName) {
    return attrName.indexOf('v-on:') === 0;
  },
  updateText: function(node, value) {
    node.textContent = (typeof value =='undefined' ? '' : value)
  }
}
