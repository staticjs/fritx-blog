/**
 * Created by fritx on 5/7/14.
 */

(function () {

  var pageBase;
  var pageExt;
  var defaultPage;
  var mainPage;
  var mainTitle;
  var entryUrl;
  var onlineUrl;
  var shortName;


  function load(sel, page, isMain, callback) {
    isMain = isMain || false;
    var url = pageBase + page + pageExt;
    var dir = url.replace(
      new RegExp('[^\\/]*$', 'g'), ''
    );
    $.ajax({
      url: url,
      error: onNotFound,
      success: function (data) {
        render(data, function (err, html) {
          var $el = $(sel);
          $el.hide().html(html);

          $el.find('[src]').each(function () {
            var $el = $(this);
            $el.attr('src', function (x, old) {
              if (isAbsolute(old)) {
                return old;
              }
              return resolve(dir + old);
            });
          });

          $el.find('[href]').each(function () {
            var $el = $(this);
            $el.attr('href', function (x, old) {
              if (isAbsolute(old)) {
                $el.attr('target', '_blank');
                return old;
              }
              var prefixed = resolve(
                dir.replace(
                  new RegExp('^' + slashes(pageBase)), ''
                ) + old
              );
              var hashRegex = new RegExp('#.*');
              var hash = (function (match) {
                return match && match[0] || '';
              })(old.match(hashRegex));
              var dehashed = prefixed.replace(hashRegex, '');
              var extRegex = new RegExp(slashes(pageExt) + '$');
              if (!extRegex.test(dehashed)) {
                if (!/(^\.|\/\.?|\.html?)$/.test(dehashed)) {
                  $el.attr('target', '_blank');
                }
                return prefixed;
              }
              return '?' + dehashed.replace(extRegex, '') + hash;
            });
          });

          $el.find('p').each(function () {
            var $el = $(this);
            $el.html(function (x, old) {
              return old.replace(/\n+/g, '');
            });
          });

          if (isMain) {
            mainTitle = $el.find('h1, h2, h3, h4, h5, h6')
              .first().text();
            $('title').text(function (x, old) {
              return mainTitle + ' - ' + old;
            });
            comments();
          }

          $el.show().attr('data-loaded', true);
          if (callback) callback();
        });
      }
    });
  }

  function onNotFound() {
    if (mainPage === defaultPage) return;
    if (!$('#main-page').attr('data-loaded')) location.href = '.';
  }

  function slashes(str) {
    return str.replace(/([.?*+^$!:\[\]\\(){}|-])/g, '\\$1');
  }

  function isAbsolute(url) {
    return !url.indexOf('//') || !!~url.indexOf('://');
  }

  function resolve(path) {
    var segs = path.split('/');
    var buf = [];
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      if (seg === '.') continue;
      var last = buf[buf.length - 1];
      if (seg === '..' && last && last !== '..') {
        buf.pop();
        continue;
      }
      buf.push(seg);
    }
    return buf.join('/') || '.';
  }

  function disqus(name, title, id, url) {
    window.disqus_shortname = name;
    window.disqus_title = title;
    window.disqus_identifier = id;
    window.disqus_url = url;

    var dsq = document.createElement('script');
    dsq.async = true;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
    document.getElementsByTagName('body')[0].appendChild(dsq);
  }

  config();
  start();


  function render(data, callback) {

    //// Optional template renderer
    marked(data, callback);
  }

  function comments() {

    //// Optional comment system
    disqus(shortName, mainTitle, mainPage, onlineUrl);
  }

  function start() {
    mainPage = resolve(
      location.search.slice(1)
        .replace(new RegExp('&.*'), '') || defaultPage
    );
    onlineUrl = entryUrl + '/?' + mainPage;

    load('#sidebar-page', 'sidebar');
    load('#main-page', mainPage, true);
  }

  function config() {
    marked.setOptions({
      renderer: new marked.Renderer(),
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false
    });

    //// For comment systems
    entryUrl = 'http://fritx.github.io/blog';
    shortName = 'fritx-blog';

    pageExt = '.md';
    pageBase = 'p/';
    defaultPage = 'diary';
  }

})();
