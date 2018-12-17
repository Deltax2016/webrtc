'use strict'

function UI() {};

UI.ID_PREFIX_ = 'id-';

UI.GetID = function(element)
{
    var id = element.attr('id');

    if (id.startsWith(UI.ID_PREFIX_))
    {
        return parseInt(id.substr(UI.ID_PREFIX_.length));
    }

    return -1;
}

