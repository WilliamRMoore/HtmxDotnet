using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HtmxDotnet.Models;
using HtmxDotnet.utils;

namespace HtmxDotnet.BuilderViews
{
    public class TypeAheadBV : IBuilderView<HtmxConfig>
    {
        public HtmlBuilder RenderHtml(HtmlBuilder builder, HtmxConfig model)
        {
            builder.Open(HtmlTag.Div)
                .AddAttributes(("style", "width: 50%;"))
                .Open(HtmlTag.Input)
                    .AddAttributes(
                        ("style", "width: 100%"),
                        ("type", "text"),
                        ("name", "query"),
                        ("id", "typeahead"),
                        ("autocomplete", "off"),
                        ("placeholder", "Type to search...")
                    )
                    .AddAttributes(model.ToTupleArray())
                .Close()
                .Open(HtmlTag.Div)
                    .AddAttributes(("class", "type-ah-result"), ("id", model.HxTarget))
                .Close()
            .Close();

            return builder;
        }
    }
}