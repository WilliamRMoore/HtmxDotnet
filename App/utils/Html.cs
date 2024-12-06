using System.Collections.Concurrent;
using System.Text;
using HtmxDotnet.BuilderViews;
using Microsoft.Extensions.ObjectPool;

namespace HtmxDotnet.utils
{
    internal class HtmlNodePool
    {
        private readonly ConcurrentQueue<HtmlNode> _pool = new();
        private readonly HashSet<HtmlNode> _activeNodes = [];

        internal HtmlNode Get(HtmlTag tag)
        {
            var node = _pool.TryDequeue(out var newNode) ? newNode.ResetAndReturn(tag) : new HtmlNode(tag);

            // Mark the node as active
            lock (_activeNodes)
            {
                _activeNodes.Add(node);
            }

            return node;
        }

        internal void MarkForRelease(HtmlNode node)
        {
            lock (_activeNodes)
            {
                if (_activeNodes.Contains(node))
                {
                    _activeNodes.Remove(node);
                    _pool.Enqueue(node);
                }
            }
        }

        internal void ReleaseAll()
        {
            lock (_activeNodes)
            {
                foreach (var node in _activeNodes)
                {
                    _pool.Enqueue(node);
                }

                _activeNodes.Clear();
            }
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

    internal class HtmlNode
    {
        private Dictionary<string, string>? _attributes;
        private HashSet<string>? _cssClasses;
        private StringBuilder? _text;
        private List<(HtmlNode Node, int Position)>? _children;

        internal bool IsChildrenInitilizedWithValues => _children != null && _children.Count > 0;
        internal bool IsAttributesInitializedWithValues => _attributes != null && _attributes.Count > 0;
        internal bool IsCssClassesInitializedWithValues => _cssClasses != null && _cssClasses.Count > 0;
        internal bool IsTextInitializedWithValue => _text != null && _text.Length > 0;

        internal HtmlTag Tag { get; set; }
        internal int CurrentTextContentIndex { get; set; } = 0;

        internal HtmlNode(HtmlTag tag = HtmlTag.Div)
        {
            Tag = tag;
        }

        internal HtmlNode ResetAndReturn(HtmlTag tag)
        {
            Tag = tag;

            _attributes?.Clear();
            _cssClasses?.Clear();
            _children?.Clear();

            if (_text?.Length > 128)
            {
                _text = null;

                return this;
            }

            _text?.Clear();

            return this;
        }

        public List<(HtmlNode Node, int Position)> LazyChildren
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

        public Dictionary<string, string> LazyAttributes
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

        public HashSet<string> LazyCssClasses
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

        public StringBuilder LazyText
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

    internal static class HtmlPools
    {
        public static readonly DefaultObjectPool<StringBuilder> HtmlSbPool = new(new HtmlStringBuilderPolicy(32, 2048), 100);
        public static readonly HtmlNodePool HtmlNodePool = new();
    }


    public class HtmlBuilder : IDisposable
    {
        private readonly Stack<HtmlNode> _nodeStack = new();
        private readonly HtmlNode _rootNode;

        public HtmlBuilder(HtmlTag rootTag = HtmlTag.Div)
        {
            _rootNode = HtmlPools.HtmlNodePool.Get(rootTag); //new HtmlNode(rootTag);
            _nodeStack.Push(_rootNode);
        }

        public HtmlBuilder Open(HtmlTag tag)
        {
            var newNode = HtmlPools.HtmlNodePool.Get(tag);  //new HtmlNode(tag);
            var parent = _nodeStack.Peek();

            parent.LazyChildren.Add((newNode, parent.CurrentTextContentIndex));
            _nodeStack.Push(newNode);

            return this;
        }

        // Close the current tag and pop the stack
        public HtmlBuilder Close(HtmlTag tag)
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
        public HtmlBuilder AddAttributes(params (string name, string value)[] attributes)
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
                    AddCssClasses(value.Split(' ')); // Intercept CSS classes
                    continue;
                }

                curNodeAttrs[name] = value;
            }

            return this;
        }

        // Add CSS classes
        public HtmlBuilder AddCssClasses(params string[] cssClasses)
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
        public HtmlBuilder WithId(string id)
        {
            _nodeStack.Peek().LazyAttributes.Add("id", id);

            return this;
        }

        // Add data-* attributes
        public HtmlBuilder AddDataAttributes(params (string, string)[] dataAttributes)
        {
            var curNodeDataAttrs = _nodeStack.Peek().LazyAttributes;

            foreach (var (key, value) in dataAttributes)
            {
                curNodeDataAttrs[$"data-{key}"] = value;
            }

            return this;
        }

        // Add text to the current node
        public HtmlBuilder AddText(string text)
        {
            var node = _nodeStack.Peek();
            var nodeText = node.LazyText;

            nodeText.Append(text);
            node.CurrentTextContentIndex = nodeText.Length;

            return this;
        }

        public HtmlBuilder SanitizeAndAddText(string text)
        {
            AddText(SanitizeText(text));

            return this;
        }

        public HtmlBuilder RenderBuilderView<VT>(IBuilderView<VT> bv, VT model)
        {
            bv.RenderHtml(this, model);

            return this;
        }

        // Build the final HTML string
        public string Build()
        {
            var stringBuilder = HtmlPools.HtmlSbPool.Get();

            BuildNode(_rootNode, stringBuilder);

            var text = stringBuilder.ToString();

            HtmlPools.HtmlSbPool.Return(stringBuilder);

            return text;
        }

        private static void Release(HtmlNode node)
        {
            if (node.IsChildrenInitilizedWithValues)
            {
                node.LazyChildren.ForEach(c => Release(c.Node));
            }

            HtmlPools.HtmlNodePool.MarkForRelease(node);

            return;

        }

        // Recursively build the node and its children
        private static void BuildNode(HtmlNode node, StringBuilder sb)
        {
            var nodeTextIntilized = node.IsTextInitializedWithValue;
            var nodeCssInitilized = node.IsCssClassesInitializedWithValues;
            var nodeAttrsInitilized = node.IsAttributesInitializedWithValues;
            var nodeChildrenInitilized = node.IsChildrenInitilizedWithValues;
            var nodeTag = node.Tag;
            var nodeTagText = nodeTag.ToTagName();

            // Open tag
            sb.Append('<').Append(nodeTagText);

            // Add CSS classes if present
            if (nodeCssInitilized)
            {
                var nodeCssClasses = node.LazyCssClasses;

                sb.Append(" class=\"");

                foreach (var cssClass in nodeCssClasses)
                {
                    sb.Append(cssClass).Append(' ');
                }

                sb.Append('"');
            }

            // Add attributes
            if (nodeAttrsInitilized)
            {
                var nodeAttrs = node.LazyAttributes;

                foreach (var (key, value) in nodeAttrs)
                {
                    sb.Append(' ').Append(key).Append("=\"").Append(value).Append('"');
                }
            }

            sb.Append('>');

            // Add text content before the first child

            int lastPosition = 0;

            if (nodeChildrenInitilized)
            {
                var nodeChildren = node.LazyChildren;

                foreach (var (child, position) in nodeChildren)
                {
                    if (nodeTextIntilized)
                    {
                        var nodeText = node.LazyText.GetChunks();

                        foreach (var chunk in nodeText)
                        {
                            var tSpan = chunk.Span;
                            sb.Append(tSpan[lastPosition..position]);
                        }
                    }

                    BuildNode(child, sb);

                    lastPosition = position;
                }
            }

            // Add remaining text after the last child
            if (nodeTextIntilized)
            {
                var nodeText = node.LazyText.GetChunks();

                foreach (var chunk in nodeText)
                {
                    var tSpan = chunk.Span;
                    sb.Append(tSpan[lastPosition..]);
                }
            }

            // Close tag
            if (!nodeTag.IsSelfClosing())
            {
                sb.Append("</").Append(nodeTagText).Append('>');
            }
        }

        public static unsafe string SanitizeText(ReadOnlySpan<char> text)
        {
            var sb = HtmlPools.HtmlSbPool.Get();

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

            var sanitizedText = sb.ToString();
            HtmlPools.HtmlSbPool.Return(sb);

            return sanitizedText;
        }

        public void Dispose()
        {
            Release(_rootNode);
            HtmlPools.HtmlNodePool.ReleaseAll();
        }
    }

    public static class HtmlTagEnumExtensions
    {
        private static readonly HtmlTag[] _selfClosingTags =
        [
            HtmlTag.Link,
            HtmlTag.Img,
            HtmlTag.Br,
            HtmlTag.Hr,
            HtmlTag.Wbr,
            HtmlTag.Embed,
            HtmlTag.Meta,
            HtmlTag.Area,
            HtmlTag.Col,
            HtmlTag.Base,
            HtmlTag.Param,
            HtmlTag.Source,
            HtmlTag.Track,
        ];

        private static readonly ConcurrentDictionary<HtmlTag, string> _tagNameFlyWeight = []; //Cache tag strings, save some memory!

        public static string ToTagName(this HtmlTag tag)
        {
            return _tagNameFlyWeight.GetOrAdd(tag, tag => tag.ToString().ToLower());
        }

        public unsafe static bool IsSelfClosing(this HtmlTag tag)
        {
            fixed (HtmlTag* tagsPtr = _selfClosingTags)  // Pin the array to a fixed location in memory
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

    public enum HtmlTag
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