using System.Collections.Concurrent;
using System.Text;
using HtmxDotnet.BuilderViews;
using Microsoft.Extensions.ObjectPool;

namespace HtmxDotnet.utils
{
    internal sealed class HtmlNodePool
    {
        private readonly ObjectPool<HtmlNode> _pool;

        internal HtmlNodePool(int maxCap)
        {
            _pool = new DefaultObjectPool<HtmlNode>(new HtmlNodePolicy(), maxCap);
        }

        internal HtmlNode Get(Tag tag)
        {
            var node = _pool.Get();
            node.Tag = tag;
            return node;
        }

        internal void MarkForRelease(HtmlNode node)
        {
            _pool.Return(node);
        }
    }

    internal class HtmlNodePolicy : PooledObjectPolicy<HtmlNode>
    {
        public override HtmlNode Create()
        {
            return new HtmlNode();
        }

        public override bool Return(HtmlNode obj)
        {
            obj.ResetAndReturn(); // Reset the node for reuse
            return true;
        }
    }

    internal class HtmlStringBuilderPolicy : PooledObjectPolicy<StringBuilder>
    {
        private readonly int _initialCap;
        private readonly int _maxCap;

        public HtmlStringBuilderPolicy(int initialCap, int maxCap)
        {
            _maxCap = maxCap;
            _initialCap = initialCap;
        }

        public override StringBuilder Create()
        {
            return new StringBuilder(_initialCap);
        }

        public override bool Return(StringBuilder sb)
        {
            if (sb.Capacity > _maxCap)
            {
                return false;
            }

            sb.Clear();

            return true;
        }
    }

    internal static class HtmlPools
    {
        internal static readonly DefaultObjectPool<StringBuilder> HtmlBuilderSbPool = new(new HtmlStringBuilderPolicy(64, 10_000), 50);
        internal static readonly DefaultObjectPool<StringBuilder> SanitizerSbPool = new(new HtmlStringBuilderPolicy(64, 1_024), 100);
        internal static readonly HtmlNodePool HtmlNodePool = new(1000);
    }

    internal sealed class HtmlNode
    {
        private Dictionary<string, string>? _attributes;
        private HashSet<string>? _cssClasses;
        private StringBuilder? _text;
        private List<(HtmlNode Node, int Position)>? _children;

        internal bool HasChildren => _children != null && _children.Count > 0;
        internal bool HasAttributes => _attributes != null && _attributes.Count > 0;
        internal bool HasCssClasses => _cssClasses != null && _cssClasses.Count > 0;
        internal bool HasText => _text != null && _text.Length > 0;

        internal Tag Tag { get; set; }
        internal int CurrentTextContentIndex { get; set; } = 0;

        internal HtmlNode(Tag tag = Tag.Div)
        {
            Tag = tag;
        }

        internal HtmlNode ResetAndReturn()
        {
            CurrentTextContentIndex = 0;

            _attributes?.Clear();
            _cssClasses?.Clear();
            _children?.Clear();

            if (_text?.Length > 1024)
            {
                _text = null;

                return this;
            }

            _text?.Clear();

            return this;
        }

        internal List<(HtmlNode Node, int Position)> LazyChildren
        {
            get
            {
                if (_children != null)
                {
                    return _children;
                }

                _children = [];

                return _children;
            }
        }

        internal Dictionary<string, string> LazyAttributes
        {
            get
            {
                if (_attributes != null)
                {
                    return _attributes;
                }

                _attributes = [];

                return _attributes;
            }
        }

        internal HashSet<string> LazyCssClasses
        {
            get
            {
                if (_cssClasses != null)
                {
                    return _cssClasses;
                }

                _cssClasses = [];

                return _cssClasses;
            }
        }

        internal StringBuilder LazyText
        {
            get
            {
                if (_text != null)
                {
                    return _text;
                }

                _text = new(64);

                return _text;
            }
        }
    }

    public sealed class HtmlBuilder : IDisposable
    {
        private readonly Stack<HtmlNode> _nodeStack = new();
        private readonly HtmlNode _rootNode;

        public HtmlBuilder(Tag rootTag = Tag.Div)
        {
            _rootNode = HtmlPools.HtmlNodePool.Get(rootTag);
            _nodeStack.Push(_rootNode);
        }

        public HtmlBuilder Open(Tag tag)
        {
            var newNode = HtmlPools.HtmlNodePool.Get(tag);
            var parent = _nodeStack.Peek();

            parent.LazyChildren.Add((newNode, parent.CurrentTextContentIndex));
            _nodeStack.Push(newNode);

            return this;
        }

        // Close the current tag and pop the stack
        public HtmlBuilder Close(Tag tag)
        {
            if (_nodeStack.Count <= 1)
            {
                return this;
            }

            if (_nodeStack.Peek().Tag != tag)
            {
                throw new Exception(
                $@"ERROR: Incorrect closing tag used. 
                       Received: [{tag.ToTagName()}]
                       Wants: [{_nodeStack.Peek().Tag.ToTagName()}]

                    ");
            }

            _nodeStack.Pop();

            return this;
        }

        public HtmlBuilder Close()
        {
            if (_nodeStack.Count <= 1)
            {
                return this;
            }

            _nodeStack.Pop();

            return this;
        }

        // Add arbitrary attributes
        public HtmlBuilder Attributes(params (string name, string value)[] attributes)
        {
            var curNodeAttrs = _nodeStack.Peek().LazyAttributes;
            Span<(string name, string value)> attributeSpan = attributes;

            for (var i = 0; i < attributeSpan.Length; i++)
            {
                var attr = attributeSpan[i];
                var name = attr.name;
                var value = attr.value;

                if (name.Length == 5 && name.Equals("class", StringComparison.Ordinal))
                {
                    Class(value.Split(' ')); // Intercept CSS classes

                    continue;
                }

                curNodeAttrs[name] = value;
            }

            return this;
        }

        // Add CSS classes
        public HtmlBuilder Class(params string[] cssClasses)
        {
            var curNodeCssClasses = _nodeStack.Peek().LazyCssClasses;

            Span<string> cssClassSpan = cssClasses;

            for (var i = 0; i < cssClassSpan.Length; i++)
            {
                curNodeCssClasses.Add(cssClassSpan[i]);
            }

            return this;
        }

        // Set the ID attribute
        public HtmlBuilder Id(string id)
        {
            _nodeStack.Peek().LazyAttributes.Add("id", id);

            return this;
        }

        // Add data-* attributes
        public HtmlBuilder DataAttributes(params (string, string)[] dataAttributes)
        {
            var curNodeDataAttrs = _nodeStack.Peek().LazyAttributes;

            foreach (var (key, value) in dataAttributes)
            {
                curNodeDataAttrs[$"data-{key}"] = value;
            }

            return this;
        }

        // Add text to the current node
        public HtmlBuilder Text(string text)
        {
            var node = _nodeStack.Peek();
            var nodeText = node.LazyText;

            nodeText.Append(text);
            node.CurrentTextContentIndex = nodeText.Length;

            return this;
        }

        private void InternalText(StringBuilder text)
        {
            var node = _nodeStack.Peek();
            var nodeText = node.LazyText;

            nodeText.Append(text);
            node.CurrentTextContentIndex = nodeText.Length;

            HtmlPools.HtmlBuilderSbPool.Return(text);
        }


        public HtmlBuilder SanitizeAndAddText(string text)
        {
            InternalText(SanitizeText(text));

            return this;
        }

        private static unsafe StringBuilder SanitizeText(ReadOnlySpan<char> text)
        {
            var sb = HtmlPools.HtmlBuilderSbPool.Get();

            fixed (char* ptr = text)
            {
                char* current = ptr;
                char* end = ptr + text.Length;

                while (current < end)
                {
                    char c = *current++;
                    int ascii = c;

                    if ((ascii & ~0x7F) != 0) // Check if the character is non-ASCII
                    {
                        sb.Append(c);

                        continue;
                    }

                    switch (ascii)
                    {
                        case '<': // ASCII 0x3C
                            sb.Append("&lt;");
                            break;
                        case '>': // ASCII 0x3E
                            sb.Append("&gt;");
                            break;
                        case '&': // ASCII 0x26
                            sb.Append("&amp;");
                            break;
                        case '"': // ASCII 0x22
                            sb.Append("&quot;");
                            break;
                        case '\'': // ASCII 0x27
                            sb.Append("&#39;");
                            break;
                        case '/': // ASCII 0x2F
                            sb.Append("&#47;");
                            break;
                        case '\\': // ASCII 0x5C
                            sb.Append("\\\\");
                            break;
                        case '\n': // ASCII 0x0A
                            sb.Append("\\n");
                            break;
                        case '\r': // ASCII 0x0D
                            sb.Append("\\r");
                            break;
                        default:
                            sb.Append(c);
                            break;
                    }
                }
            }

            return sb;
        }

        public HtmlBuilder RenderBuilderView<VT>(IBuilderView<VT> bv, VT model)
        {
            bv.RenderHtml(this, model);

            return this;
        }

        public string Build(bool includeDocType = false)
        {
            return BuildInternal(includeDocType, pretty: false);
        }

        public string BuildPretty(bool includeDocType = false)
        {
            return BuildInternal(includeDocType, pretty: true);
        }

        // Build the final HTML string
        private string BuildInternal(bool includeDocType, bool pretty)
        {
            var stringBuilder = HtmlPools.HtmlBuilderSbPool.Get();

            if (includeDocType)
            {
                stringBuilder.Append("<!DOCTYPE html>");
            }

            BuildNode(_rootNode, stringBuilder, pretty ? 0 : -1);

            var text = stringBuilder.ToString();

            HtmlPools.HtmlBuilderSbPool.Return(stringBuilder);

            return text;
        }

        private static void Release(HtmlNode node)
        {
            if (node.HasChildren)
            {
                node.LazyChildren.ForEach(c => Release(c.Node));
            }

            HtmlPools.HtmlNodePool.MarkForRelease(node);

            return;

        }

        // Recursively build the node and its children
        private static void BuildNode(HtmlNode node, StringBuilder sb, int indentLevel)
        {
            // pretty print values
            const int INDENT_MULTIPLIER = 1;
            bool isPretty = indentLevel >= 0;
            int currentIndentLevel = isPretty ? indentLevel * INDENT_MULTIPLIER : 0;

            // Prepare common values
            var nodeTextInitialized = node.HasText;
            var nodeCssInitialized = node.HasCssClasses;
            var nodeAttrsInitialized = node.HasAttributes;
            var nodeChildrenInitialized = node.HasChildren;
            var nodeTag = node.Tag;
            var isSelfClosing = nodeTag.IsSelfClosing();
            var nodeTagText = nodeTag.ToTagName();

            // Indent and open the tag
            if (isPretty && currentIndentLevel > 0)
            {
                sb.Append(new string(' ', currentIndentLevel));
            }

            sb.Append('<').Append(nodeTagText);

            // Add CSS classes if present
            if (nodeCssInitialized)
            {
                var nodeCssClasses = node.LazyCssClasses;

                sb.Append(" class=\"");

                foreach (var cssClass in nodeCssClasses)
                {
                    sb.Append(cssClass).Append(' ');
                }

                sb.Length--; // Remove the trailing space
                sb.Append('"');
            }

            // Add attributes if present
            if (nodeAttrsInitialized)
            {
                var nodeAttrs = node.LazyAttributes;

                foreach (var (key, value) in nodeAttrs)
                {
                    sb.Append(' ').Append(key).Append("=\"").Append(value).Append('"');
                }
            }

            // Handle self-closing tag
            if (isSelfClosing)
            {
                sb.Append(isPretty ? " />" : "/>");

                if (isPretty)
                {
                    sb.AppendLine();
                }

                return;
            }

            sb.Append('>');

            if (isPretty)
            {
                sb.AppendLine();
            }

            // Handle text content and children
            int lastPosition = 0;

            if (nodeChildrenInitialized)
            {
                var nodeChildren = node.LazyChildren;
                StringBuilder.ChunkEnumerator? nodeText = nodeTextInitialized ? node.LazyText.GetChunks() : null;

                foreach (var (child, position) in nodeChildren)
                {
                    // Add text content up to the position of the current child
                    if (nodeTextInitialized)
                    {
                        foreach (var chunk in nodeText!)
                        {
                            var tSpan = chunk.Span;

                            if (lastPosition < position)
                            {
                                if (isPretty)
                                {
                                    sb.Append(new string(' ', (indentLevel + 1) * INDENT_MULTIPLIER));
                                }

                                sb.Append(tSpan[lastPosition..position]);

                                if (isPretty)
                                {
                                    sb.AppendLine();
                                }

                            }
                        }

                        lastPosition = position;
                    }

                    // Recursively build the child node
                    BuildNode(child, sb, isPretty ? indentLevel + 1 : -1);
                }
            }

            if (nodeTextInitialized)
            {
                var nodeText = node.LazyText.GetChunks();

                foreach (var chunk in nodeText)
                {
                    var tSpan = chunk.Span;

                    if (lastPosition < tSpan.Length)
                    {
                        if (isPretty)
                        {
                            sb.Append(new string(' ', (indentLevel + 1) * INDENT_MULTIPLIER));
                        }

                        sb.Append(tSpan[lastPosition..]);

                        if (isPretty)
                        {
                            sb.AppendLine();
                        }
                    }
                }
            }

            // Close the tag
            if (isPretty && currentIndentLevel > 0)
            {
                sb.Append(new string(' ', currentIndentLevel));
            }

            sb.Append("</").Append(nodeTagText).Append('>');

            if (isPretty)
            {
                sb.AppendLine();
            }
        }

        public void Dispose()
        {
            Release(_rootNode);
        }
    }

    public static class HtmlTagEnumExtensions
    {
        private static readonly Tag[] _selfClosingTags =
        [
            Tag.Link,
            Tag.Img,
            Tag.Br,
            Tag.Hr,
            Tag.Wbr,
            Tag.Embed,
            Tag.Meta,
            Tag.Area,
            Tag.Col,
            Tag.Base,
            Tag.Param,
            Tag.Source,
            Tag.Track,
        ];

        private static readonly ConcurrentDictionary<Tag, string> _tagNameFlyWeight = []; //Cache tag strings, save some memory!

        public static string ToTagName(this Tag tag)
        {
            // This can be made much faster
            return _tagNameFlyWeight.GetOrAdd(tag, tag => tag.ToString().ToLower());
        }

        public unsafe static bool IsSelfClosing(this Tag tag)
        {
            fixed (Tag* tagsPtr = _selfClosingTags)  // Pin the array to a fixed location in memory
            {
                for (var i = 0; i < _selfClosingTags.Length; i++)
                {
                    if (*(tagsPtr + i) == tag)  // Access the tag directly through the pointer
                    {
                        return true;
                    }
                }
            }

            return false;
        }
    }

    public enum Tag
    {
        // Document metadata
        Html,
        Head,
        Title,
        Meta,
        Link,
        Style,
        Script,
        Base,

        // Sectioning root
        Body,

        // Content sectioning
        Header,
        Footer,
        Section,
        Nav,
        Article,
        Aside,
        H1,
        H2,
        H3,
        H4,
        H5,
        H6,

        // Text content
        P,
        Blockquote,
        Div,
        Span,
        A,
        Em,
        Strong,
        Small,
        Cite,
        Q,
        Dfn,
        Abbr,
        Time,
        Code,
        Var,
        Samp,
        Kbd,
        Sub,
        Sup,
        I,
        B,
        U,
        Mark,
        Ruby,
        Rt,
        Rp,
        Bdi,
        Bdo,
        Br,
        Wbr,

        // Edits
        Ins,
        Del,

        // Embedded content
        Img,
        Iframe,
        Embed,
        Object,
        Param,
        Video,
        Audio,
        Source,
        Track,
        Canvas,
        Map,
        Area,
        Svg,
        Math,

        // Tabular data
        Table,
        Caption,
        Colgroup,
        Col,
        Tbody,
        Thead,
        Tfoot,
        Tr,
        Td,
        Th,

        // Forms
        Form,
        Fieldset,
        Legend,
        Label,
        Input,
        Button,
        Select,
        Datalist,
        Optgroup,
        Option,
        Textarea,
        Output,
        Progress,
        Meter,

        // Interactive elements
        Details,
        Summary,
        Dialog,

        // Lists
        Ul,
        Ol,
        Li,
        Dl,
        Dt,
        Dd,

        // Miscellaneous
        Figure,
        Figcaption,
        Hr,
        Pre,
        Main,
        Template,
        Noscript
    }
}